"""Collect EZKL baseline metrics."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Any

from zyocra_bench.config import (
    EZKL_COMPILED,
    EZKL_DEMO,
    EZKL_PK,
    EZKL_PROOF,
    EZKL_ROOT,
    EZKL_SETTINGS,
    EZKL_SRS,
    EZKL_VK,
    EZKL_WITNESS,
    PROVE_RUNS,
    PYTHON,
)
from zyocra_bench.timing import median_runs, run_once


def _require(path: Path, hint: str) -> None:
    if not path.is_file():
        raise FileNotFoundError(f"missing {path} — {hint}")


def _circuit_size() -> dict[str, int | None]:
    if not EZKL_SETTINGS.is_file():
        return {"num_rows": None, "total_assignments": None}
    data = json.loads(EZKL_SETTINGS.read_text(encoding="utf-8"))
    return {
        "num_rows": int(data["num_rows"]) if data.get("num_rows") is not None else None,
        "total_assignments": int(data["total_assignments"])
        if data.get("total_assignments") is not None
        else None,
    }


def _prove_via_python() -> None:
    sys.path.insert(0, str(EZKL_ROOT))
    from zyocra_ezkl.pipeline import prove

    prove(EZKL_WITNESS, EZKL_COMPILED, EZKL_PK, EZKL_PROOF, EZKL_SRS)


def _verify_via_python() -> bool:
    sys.path.insert(0, str(EZKL_ROOT))
    from zyocra_ezkl.config import SETTINGS_JSON
    from zyocra_ezkl.pipeline import verify

    return verify(EZKL_PROOF, SETTINGS_JSON, EZKL_VK, EZKL_SRS)


def collect_ezkl(*, refresh_prove: bool = False) -> dict[str, Any]:
    """Measure EZKL path; assumes pipeline artifacts exist unless refresh_prove."""
    _require(EZKL_WITNESS, "run circuits-baseline/scripts/run_pipeline.sh")
    _require(EZKL_PK, "run circuits-baseline/scripts/setup.py")
    _require(EZKL_COMPILED, "run circuits-baseline/scripts/compile_circuit.py")

    if refresh_prove or not EZKL_PROOF.is_file():
        _prove_via_python()

    _require(EZKL_PROOF, "prove step failed")

    py = str(PYTHON) if PYTHON.is_file() else sys.executable
    prove_script = EZKL_ROOT / "scripts" / "prove.py"
    verify_script = EZKL_ROOT / "scripts" / "verify.py"

    prove_stats = median_runs([py, str(prove_script)], PROVE_RUNS, cwd=EZKL_ROOT)

    t0 = time.perf_counter()
    ok = _verify_via_python()
    verify_ms = (time.perf_counter() - t0) * 1000.0
    if not ok:
        raise RuntimeError("EZKL off-chain verify failed")

    circuit = _circuit_size()
    score_float = None
    if EZKL_DEMO.is_file():
        score_float = json.loads(EZKL_DEMO.read_text(encoding="utf-8")).get("score_float")

    return {
        "path": "ezkl",
        "scope": "Full ONNX graph (6→16→8→1 + sigmoid) via EZKL 23.0.5",
        "artifacts": {
            "settings": str(EZKL_SETTINGS),
            "compiled": str(EZKL_COMPILED),
            "proof": str(EZKL_PROOF),
            "witness": str(EZKL_WITNESS),
        },
        "constraint_count": circuit["num_rows"],
        "constraint_count_secondary": circuit["total_assignments"],
        "constraint_metric_note": "num_rows from settings.json (EZKL PLONK rows); total_assignments also reported",
        "prove_ms_median": round(prove_stats.wall_ms, 2),
        "prove_runs": PROVE_RUNS,
        "verify_ms": round(verify_ms, 2),
        "verify_kind": "off_chain_ezkl",
        "proof_size_bytes": EZKL_PROOF.stat().st_size,
        "peak_rss_kb": prove_stats.peak_rss_kb,
        "score_float_witness": score_float,
        "available": True,
    }
