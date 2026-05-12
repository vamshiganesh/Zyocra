"""Accuracy metrics where comparable; document scope boundaries."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from zyocra_bench.config import (
    CIRCOM_FIXTURE,
    EZKL_DEMO,
    EZKL_VALIDATION,
    ML_ROOT,
    SAMPLE_INDEX,
)


def _load_validation() -> dict[str, Any] | None:
    if not EZKL_VALIDATION.is_file():
        return None
    return json.loads(EZKL_VALIDATION.read_text(encoding="utf-8"))


def _collect_head_alignment() -> dict[str, Any] | None:
    if not CIRCOM_FIXTURE.is_file():
        return None

    import numpy as np

    circuits_custom = str(ML_ROOT.parent / "circuits-custom")
    if circuits_custom not in sys.path:
        sys.path.insert(0, circuits_custom)

    from zyocra_circom.config import ACTIVATION_SCALE, CHECKPOINT, WEIGHT_SCALE
    from zyocra_circom.fixed_point import dequantize_logit, logit_accumulator
    from zyocra_circom.weights import _head_tensors_from_checkpoint, _hidden_from_checkpoint  # noqa: PLC2701

    payload = json.loads(CIRCOM_FIXTURE.read_text(encoding="utf-8"))
    circom_logit_acc = int(payload["logit_acc"])

    if not CHECKPOINT.is_file():
        return {
            "comparable": False,
            "note": "ml-base checkpoint missing — cannot run forward alignment",
            "circom_logit_acc": circom_logit_acc,
        }

    hidden = _hidden_from_checkpoint(CHECKPOINT, sample_index=SAMPLE_INDEX)
    weight_base, lora_a, lora_b = _head_tensors_from_checkpoint(CHECKPOINT)
    lora_b_mat = lora_b.reshape(4, 8)
    ml_logit_acc = logit_accumulator(hidden, weight_base, lora_a, lora_b_mat)
    ml_logit_float = dequantize_logit(ml_logit_acc, ACTIVATION_SCALE, WEIGHT_SCALE)

    return {
        "comparable": True,
        "sample_index": SAMPLE_INDEX,
        "ml_base_logit_acc": ml_logit_acc,
        "ml_base_logit_float": ml_logit_float,
        "circom_fixture_logit_acc": circom_logit_acc,
        "integer_match": ml_logit_acc == circom_logit_acc,
        "fixture_recompute_match": circom_logit_acc == payload["logit_acc"],
    }


def collect_accuracy() -> dict[str, Any]:
    """
    EZKL: full-model float vs fixed-point error from ml-base validation.
    Circom: head logit integer check on fixture.
    head_alignment: ml-base head forward vs Circom fixture on same hidden vector.
    """
    result: dict[str, Any] = {
        "ezkl_full_model": None,
        "circom_head_subgraph": None,
        "head_alignment": None,
        "comparable_note": (
            "EZKL full graph proves end-to-end risk score; Circom proves output-head logit_acc. "
            "Use head_alignment for apples-to-apples hidden→logit comparison on sample_index=0."
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

    result["head_alignment"] = _collect_head_alignment()

    return result
