"""Accuracy metrics where comparable; document scope boundaries."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from zyocra_bench.config import (
    CIRCOM_FIXTURE,
    EZKL_DEMO,
    EZKL_VALIDATION,
    ML_ROOT,
)


def _load_validation() -> dict[str, Any] | None:
    if not EZKL_VALIDATION.is_file():
        return None
    return json.loads(EZKL_VALIDATION.read_text(encoding="utf-8"))


def collect_accuracy() -> dict[str, Any]:
    """
    EZKL: full-model float vs fixed-point error from ml-base validation.
    Circom: head logit dequant error vs Python reference on fixture hidden vector.
    """
    result: dict[str, Any] = {
        "ezkl_full_model": None,
        "circom_head_subgraph": None,
        "comparable_note": (
            "EZKL proves the full graph score; Circom proves only the output-head "
            "logit accumulator. Full-score accuracy is not directly comparable — "
            "see circom_head_subgraph for head-layer numeric check."
        ),
    }

    validation = _load_validation()
    if validation:
        summary = validation.get("summary", {}).get("float_vs_quantized_fixed_point", {})
        result["ezkl_full_model"] = {
            "metric": "float32 vs Q8.8 fixed-point inference (ml-base test split)",
            "test_rows": validation.get("test_rows"),
            "mean_abs_error": summary.get("mean_abs_error"),
            "max_abs_error": summary.get("max_abs_error"),
            "mean_rel_error": summary.get("mean_rel_error"),
            "max_rel_error": summary.get("max_rel_error"),
        }

    if EZKL_DEMO.is_file():
        demo = json.loads(EZKL_DEMO.read_text(encoding="utf-8"))
        result["ezkl_demo_sample"] = {
            "sample_index": demo.get("sample_index"),
            "witness_score_float": demo.get("score_float"),
        }

    if CIRCOM_FIXTURE.is_file():
        import numpy as np

        sys_path = str(ML_ROOT.parent / "circuits-custom")
        if sys_path not in __import__("sys").path:
            __import__("sys").path.insert(0, sys_path)

        from zyocra_circom.config import ACTIVATION_SCALE, WEIGHT_SCALE
        from zyocra_circom.fixed_point import dequantize_logit, logit_accumulator

        payload = json.loads(CIRCOM_FIXTURE.read_text(encoding="utf-8"))
        hidden = np.array(payload["hidden"], dtype=np.int32)
        w = np.array(payload["weight_base"], dtype=np.int32)
        a = np.array(payload["lora_a"], dtype=np.int32)
        b = np.array(payload["lora_b"], dtype=np.int32).reshape(4, 8)
        acc = logit_accumulator(hidden, w, a, b)
        dequant = dequantize_logit(acc, ACTIVATION_SCALE, WEIGHT_SCALE)

        result["circom_head_subgraph"] = {
            "metric": "integer logit_acc vs reference recompute on fixture",
            "fixture": str(CIRCOM_FIXTURE),
            "logit_acc": acc,
            "dequantized_logit": dequant,
            "recompute_match": acc == payload["logit_acc"],
        }

    return result
