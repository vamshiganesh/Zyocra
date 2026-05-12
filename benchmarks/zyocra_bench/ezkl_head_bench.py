"""Collect EZKL head-only subgraph metrics (comparable to Circom head)."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

from zyocra_bench.config import (
    EZKL_HEAD_COMPILED,
    EZKL_HEAD_PK,
    EZKL_HEAD_PROOF,
    EZKL_HEAD_ROOT,
    EZKL_HEAD_SETTINGS,
    EZKL_HEAD_SRS,
    EZKL_HEAD_VK,
    EZKL_HEAD_WITNESS,
    EZKL_ROOT,
    PROVE_RUNS,
    PYTHON,
)
from zyocra_bench.timing import run_aggregate


def _require(path: Path, hint: str) -> None:
    if not path.is_file():
        raise FileNotFoundError(f"missing {path} — {hint}")


def _circuit_size() -> dict[str, int | None]:
    if not EZKL_HEAD_SETTINGS.is_file():
        return {"num_rows": None, "total_assignments": None}
    data = json.loads(EZKL_HEAD_SETTINGS.read_text(encoding="utf-8"))
    return {
        "num_rows": int(data["num_rows"]) if data.get("num_rows") is not None else None,
        "total_assignments": int(data["total_assignments"])
        if data.get("total_assignments") is not None
        else None,
    }


def _ensure_head_artifacts() -> None:
    if EZKL_HEAD_COMPILED.is_file() and EZKL_HEAD_PK.is_file():
        return
    prepare = EZKL_ROOT / "scripts" / "prepare_head.py"
    if not prepare.is_file():
        raise FileNotFoundError("prepare_head.py missing")
    import subprocess

    py = str(PYTHON) if PYTHON.is_file() else sys.executable
    subprocess.run([py, str(prepare)], cwd=EZKL_ROOT, check=True)


def collect_ezkl_head(*, refresh_prove: bool = False) -> dict[str, Any]:
    """Measure EZKL head-only path; builds artifacts on first run if checkpoint exists."""
    _ensure_head_artifacts()
    _require(EZKL_HEAD_COMPILED, "run circuits-baseline/scripts/prepare_head.py")
    _require(EZKL_HEAD_PK, "run circuits-baseline/scripts/prepare_head.py")

    sys.path.insert(0, str(EZKL_ROOT))
    from zyocra_ezkl.pipeline import gen_witness, prove, verify, write_input_json

    witness_input = EZKL_HEAD_ROOT / "settings" / "head-input.json"
    if not witness_input.is_file():
        sys.path.insert(0, str(EZKL_ROOT.parent / "circuits-custom"))
        from zyocra_circom.weights import _hidden_from_checkpoint  # noqa: PLC2701

        hidden = _hidden_from_checkpoint(
            EZKL_ROOT.parent / "ml-base" / "artifacts" / "models" / "zyocra-risk-mlp-v1.pt",
            sample_index=0,
        )
        hidden_f = (hidden.astype(float) / 128.0).reshape(1, -1)
        write_input_json(hidden_f, witness_input)

    if not EZKL_HEAD_WITNESS.is_file() or refresh_prove:
        gen_witness(
            witness_input,
            compiled=EZKL_HEAD_COMPILED,
            witness=EZKL_HEAD_WITNESS,
            vk=EZKL_HEAD_VK,
            srs=EZKL_HEAD_SRS,
        )

    if refresh_prove or not EZKL_HEAD_PROOF.is_file():
        prove(
            EZKL_HEAD_WITNESS,
            EZKL_HEAD_COMPILED,
            EZKL_HEAD_PK,
            EZKL_HEAD_PROOF,
            EZKL_HEAD_SRS,
        )

    _require(EZKL_HEAD_PROOF, "head prove failed")

    py = str(PYTHON) if PYTHON.is_file() else sys.executable
    prove_script = EZKL_ROOT / "scripts" / "prove.py"
    prove_agg = run_aggregate(
        [py, str(prove_script), "--witness", str(EZKL_HEAD_WITNESS), "--proof", str(EZKL_HEAD_PROOF)],
        PROVE_RUNS,
        cwd=EZKL_ROOT,
    )

    t0 = time.perf_counter()
    ok = verify(EZKL_HEAD_PROOF, EZKL_HEAD_SETTINGS, EZKL_HEAD_VK, EZKL_HEAD_SRS)
    verify_ms = (time.perf_counter() - t0) * 1000.0
    if not ok:
        raise RuntimeError("EZKL head off-chain verify failed")

    circuit = _circuit_size()
    return {
        "path": "ezkl_head",
        "scope": "Head-only ONNX (hidden[8] -> logit) — comparable subgraph to Circom",
        "artifacts": {
            "settings": str(EZKL_HEAD_SETTINGS),
            "compiled": str(EZKL_HEAD_COMPILED),
            "proof": str(EZKL_HEAD_PROOF),
            "witness": str(EZKL_HEAD_WITNESS),
        },
        "constraint_count": circuit["num_rows"],
        "constraint_count_secondary": circuit["total_assignments"],
        "matmul_count": 1,
        "prove_ms_median": round(prove_agg.wall_ms_median, 2),
        "prove_ms_min": round(prove_agg.wall_ms_min, 2),
        "prove_ms_max": round(prove_agg.wall_ms_max, 2),
        "prove_ms_stdev": prove_agg.wall_ms_stdev,
        "prove_runs": PROVE_RUNS,
        "verify_ms": round(verify_ms, 2),
        "verify_kind": "off_chain_ezkl",
        "proof_size_bytes": EZKL_HEAD_PROOF.stat().st_size if EZKL_HEAD_PROOF.is_file() else None,
        "peak_rss_kb": prove_agg.peak_rss_kb,
        "available": True,
    }
