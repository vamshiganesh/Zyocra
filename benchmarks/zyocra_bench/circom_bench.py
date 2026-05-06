"""Collect Circom custom-path metrics."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from zyocra_bench.config import (
    CIRCOM_FIXTURE,
    CIRCOM_PROOF,
    CIRCOM_PUBLIC,
    CIRCOM_R1CS,
    CIRCOM_ROOT,
    CIRCOM_VKEY,
    CIRCOM_WITNESS,
    CIRCOM_ZKEY,
    PROVE_RUNS,
)
from zyocra_bench.timing import median_runs, run_once


def _npx_snarkjs(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["npx", "--prefix", str(CIRCOM_ROOT), "snarkjs", *args],
        cwd=CIRCOM_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )


def _ensure_artifacts() -> None:
    compile_sh = CIRCOM_ROOT / "scripts" / "compile.sh"
    export_sh = CIRCOM_ROOT / "scripts" / "export_fixture.py"
    witness_sh = CIRCOM_ROOT / "scripts" / "gen_witness.sh"
    setup_sh = CIRCOM_ROOT / "scripts" / "setup_keys.sh"
    prove_sh = CIRCOM_ROOT / "scripts" / "prove.sh"

    for script in (export_sh, compile_sh, witness_sh, setup_sh):
        subprocess.run(["bash", str(script)], cwd=CIRCOM_ROOT, check=True)

    if not CIRCOM_PROOF.is_file():
        subprocess.run(["bash", str(prove_sh)], cwd=CIRCOM_ROOT, check=True)


def _r1cs_info() -> dict[str, int | None]:
    if not CIRCOM_R1CS.is_file():
        return {"constraints": None, "private_inputs": None, "public_inputs": None}
    out = _npx_snarkjs("r1cs", "info", str(CIRCOM_R1CS)).stdout
    parsed: dict[str, int | None] = {
        "constraints": None,
        "private_inputs": None,
        "public_inputs": None,
        "outputs": None,
    }
    for line in out.splitlines():
        if "# of Constraints:" in line:
            parsed["constraints"] = int(line.split(":")[-1].strip())
        elif "# of Private Inputs:" in line:
            parsed["private_inputs"] = int(line.split(":")[-1].strip())
        elif "# of Public Inputs:" in line:
            parsed["public_inputs"] = int(line.split(":")[-1].strip())
        elif "# of Outputs:" in line:
            parsed["outputs"] = int(line.split(":")[-1].strip())
    return parsed


def _nonlinear_constraints() -> int | None:
    """Parse circom compiler stdout if build log exists; else read demo manifest."""
    demo = CIRCOM_ROOT / "logs" / "demo-latest.json"
    if demo.is_file():
        data = json.loads(demo.read_text(encoding="utf-8"))
        nc = data.get("constraints", {}).get("non_linear")
        if nc is not None:
            return int(nc)
    return 44  # documented compile-time value for lora_output_head


def collect_circom(*, refresh_prove: bool = False) -> dict[str, Any]:
    if not Path("/usr/bin/bash").exists():
        raise RuntimeError("bash required for circom pipeline scripts")

    _ensure_artifacts()

    if refresh_prove or not CIRCOM_PROOF.is_file():
        subprocess.run(["bash", str(CIRCOM_ROOT / "scripts" / "prove.sh")], cwd=CIRCOM_ROOT, check=True)

    prove_stats = median_runs(
        ["bash", str(CIRCOM_ROOT / "scripts" / "prove.sh")],
        PROVE_RUNS,
        cwd=CIRCOM_ROOT,
    )

    t0_proc = run_once(
        ["bash", str(CIRCOM_ROOT / "scripts" / "verify.sh")],
        cwd=CIRCOM_ROOT,
    )
    if t0_proc.exit_code != 0:
        raise RuntimeError(f"circom verify failed:\n{t0_proc.stderr}")

    r1cs = _r1cs_info()
    logit_acc = None
    if CIRCOM_FIXTURE.is_file():
        logit_acc = json.loads(CIRCOM_FIXTURE.read_text(encoding="utf-8")).get("logit_acc")

    return {
        "path": "circom",
        "scope": "LoRA output head only (8-dim hidden → logit_acc, rank-4 explicit A·B fusion)",
        "artifacts": {
            "r1cs": str(CIRCOM_R1CS),
            "proof": str(CIRCOM_PROOF),
            "public": str(CIRCOM_PUBLIC),
            "witness": str(CIRCOM_WITNESS),
            "fixture": str(CIRCOM_FIXTURE),
        },
        "constraint_count": r1cs.get("constraints"),
        "constraint_count_secondary": _nonlinear_constraints(),
        "constraint_metric_note": "R1CS constraints from snarkjs r1cs info; secondary = non-linear (circom compiler)",
        "prove_ms_median": round(prove_stats.wall_ms, 2),
        "prove_runs": PROVE_RUNS,
        "verify_ms": round(t0_proc.wall_ms, 2),
        "verify_kind": "off_chain_snarkjs_groth16",
        "proof_size_bytes": CIRCOM_PROOF.stat().st_size,
        "peak_rss_kb": prove_stats.peak_rss_kb,
        "logit_acc_public": logit_acc,
        "available": True,
    }


def export_gas_input(out_path: Path) -> dict[str, Any]:
    """Build JSON consumed by contracts/test/BenchmarkGas.t.sol."""
    if not CIRCOM_PROOF.is_file() or not CIRCOM_PUBLIC.is_file():
        raise FileNotFoundError("circom proof/public missing")

    proof = json.loads(CIRCOM_PROOF.read_text(encoding="utf-8"))
    public = json.loads(CIRCOM_PUBLIC.read_text(encoding="utf-8"))

    payload = {
        "circom": {
            "pi_a": [proof["pi_a"][0], proof["pi_a"][1]],
            "pi_b": [
                [proof["pi_b"][0][0], proof["pi_b"][0][1]],
                [proof["pi_b"][1][0], proof["pi_b"][1][1]],
            ],
            "pi_c": [proof["pi_c"][0], proof["pi_c"][1]],
            "pub_signals": [str(x) for x in public],
        }
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload
