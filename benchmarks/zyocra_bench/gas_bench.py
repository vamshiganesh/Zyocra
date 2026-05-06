"""On-chain verification gas via Foundry BenchmarkGas.t.sol."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path
from typing import Any

from zyocra_bench.circom_bench import export_gas_input
from zyocra_bench.config import CONTRACTS_ROOT, GAS_INPUT_JSON


def _write_ezkl_section(gas_input: Path) -> None:
    proof_path = CONTRACTS_ROOT.parent / "circuits-baseline" / "proofs" / "proof.json"
    if not proof_path.is_file():
        return

    existing: dict[str, Any] = {}
    if gas_input.is_file():
        existing = json.loads(gas_input.read_text(encoding="utf-8"))

    existing["ezkl_proof_path"] = str(proof_path)
    gas_input.parent.mkdir(parents=True, exist_ok=True)
    gas_input.write_text(json.dumps(existing, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def collect_gas() -> dict[str, Any]:
    """Run Foundry gas probes; returns nulls when artifacts or contracts missing."""
    result: dict[str, Any] = {
        "ezkl_verify_gas": None,
        "circom_verify_gas": None,
        "harness": "contracts/test/BenchmarkGas.t.sol",
        "note": "Standalone verifier.verifyProof / IRiskScoreVerifier.verify — not full oracle path",
    }

    if not (CONTRACTS_ROOT / "foundry.toml").is_file():
        result["error"] = "contracts/ not initialized"
        return result

    try:
        export_gas_input(GAS_INPUT_JSON)
    except FileNotFoundError:
        pass
    _write_ezkl_section(GAS_INPUT_JSON)

    proc = subprocess.run(
        [
            "forge",
            "test",
            "--match-contract",
            "BenchmarkGasTest",
            "-vv",
        ],
        cwd=CONTRACTS_ROOT,
        capture_output=True,
        text=True,
    )
    out = proc.stdout + proc.stderr

    ezkl_m = re.search(r"EZKL_VERIFY_GAS:\s*(\d+)", out)
    circom_m = re.search(r"CIRCOM_VERIFY_GAS:\s*(\d+)", out)

    if ezkl_m:
        result["ezkl_verify_gas"] = int(ezkl_m.group(1))
    if circom_m:
        result["circom_verify_gas"] = int(circom_m.group(1))

    if proc.returncode != 0 and not ezkl_m and not circom_m:
        result["forge_exit_code"] = proc.returncode
        result["forge_tail"] = out.strip().splitlines()[-5:]

    return result
