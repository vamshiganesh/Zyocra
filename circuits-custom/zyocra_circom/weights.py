"""Export unfrozen LoRA head weights and hidden activations for witness input."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import torch

from zyocra_circom.config import (
    ACTIVATION_SCALE,
    CHECKPOINT,
    FEATURES_TEST,
    FIXTURE_V1,
    HIDDEN_DIM,
    LORA_RANK,
    WEIGHT_SCALE,
)
from zyocra_circom.fixed_point import assert_dims, logit_accumulator


def _quantize(values: np.ndarray, scale: int) -> np.ndarray:
    scaled = np.round(values.astype(np.float64) * scale)
    return np.clip(scaled, np.iinfo(np.int32).min, np.iinfo(np.int32).max).astype(np.int32)


def _load_model(checkpoint: Path) -> torch.nn.Module:
    from zyocra_ml.inference import load_risk_mlp

    return load_risk_mlp(checkpoint)


def _hidden_from_checkpoint(checkpoint: Path, sample_index: int = 0) -> np.ndarray:
    from zyocra_ml.config import FEATURE_NAMES

    model = _load_model(checkpoint)
    model.eval()

    if FEATURES_TEST.is_file():
        data = np.load(FEATURES_TEST)
        features = data["features"][sample_index : sample_index + 1].astype(np.float32)
    else:
        rng = np.random.default_rng(2026041 + sample_index)
        features = rng.random((1, len(FEATURE_NAMES)), dtype=np.float32)

    with torch.no_grad():
        x = torch.from_numpy(features)
        hidden = x
        for module in model.backbone:
            hidden = module(hidden)
        hidden_q = _quantize(hidden.numpy().reshape(-1), ACTIVATION_SCALE)
    return hidden_q


def _head_tensors_from_checkpoint(checkpoint: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    from zyocra_ml.lora import LoRALinear

    model = _load_model(checkpoint)
    head = model.output_head
    if not isinstance(head, LoRALinear):
        raise TypeError("checkpoint head is not LoRALinear — train with LoRA enabled")

    weight_base = _quantize(head.base.weight.detach().cpu().numpy().reshape(-1), WEIGHT_SCALE)
    lora_a = _quantize(head.lora_a.detach().cpu().numpy().reshape(-1), WEIGHT_SCALE)
    lora_b = _quantize(head.lora_b.detach().cpu().numpy(), WEIGHT_SCALE)
    return weight_base, lora_a, lora_b


def synthetic_fixture(seed: int = 2026041) -> dict[str, Any]:
    """Deterministic int32 grid when ml-base checkpoint is absent."""
    rng = np.random.default_rng(seed)
    hidden = rng.integers(-400, 400, size=HIDDEN_DIM, dtype=np.int32)
    weight_base = rng.integers(-200, 200, size=HIDDEN_DIM, dtype=np.int32)
    lora_a = rng.integers(-120, 120, size=LORA_RANK, dtype=np.int32)
    lora_b = rng.integers(-120, 120, size=(LORA_RANK, HIDDEN_DIM), dtype=np.int32)
    return build_witness_payload(hidden, weight_base, lora_a, lora_b, source="synthetic", seed=seed)


def build_witness_payload(
    hidden: np.ndarray,
    weight_base: np.ndarray,
    lora_a: np.ndarray,
    lora_b: np.ndarray,
    *,
    source: str,
    sample_index: int | None = None,
    seed: int | None = None,
    borrower: int = int("70997970C51812dc3A010C7d01b50e0d17dc79C8", 16),
) -> dict[str, Any]:
    assert_dims(hidden, weight_base, lora_a, lora_b)
    acc = logit_accumulator(hidden, weight_base, lora_a, lora_b)

    payload: dict[str, Any] = {
        "source": source,
        "hidden": hidden.astype(int).tolist(),
        "borrower": int(borrower),
        "weight_base": weight_base.astype(int).tolist(),
        "lora_a": lora_a.astype(int).tolist(),
        "lora_b": lora_b.reshape(-1).astype(int).tolist(),
        "logit_acc": int(acc),
        "scales": {
            "activation_scale": ACTIVATION_SCALE,
            "weight_scale": WEIGHT_SCALE,
        },
    }
    if sample_index is not None:
        payload["sample_index"] = sample_index
    if seed is not None:
        payload["seed"] = seed
    return payload


def export_from_checkpoint(checkpoint: Path = CHECKPOINT, sample_index: int = 0) -> dict[str, Any]:
    hidden = _hidden_from_checkpoint(checkpoint, sample_index)
    weight_base, lora_a, lora_b = _head_tensors_from_checkpoint(checkpoint)
    return build_witness_payload(
        hidden,
        weight_base,
        lora_a,
        lora_b,
        source=str(checkpoint),
        sample_index=sample_index,
    )


def export_fixture(out_path: Path = FIXTURE_V1) -> dict[str, Any]:
    if CHECKPOINT.is_file():
        payload = export_from_checkpoint()
    else:
        payload = synthetic_fixture()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


DEMO_BORROWER_UINT = int("70997970C51812dc3A010C7d01b50e0d17dc79C8", 16)


def to_circom_input(payload: dict[str, Any]) -> dict[str, Any]:
    """Witness calculator input (strings for snarkjs)."""
    borrower = int(payload.get("borrower", DEMO_BORROWER_UINT))
    return {
        "hidden": [str(v) for v in payload["hidden"]],
        "borrower": str(borrower),
        "weight_base": [str(v) for v in payload["weight_base"]],
        "lora_a": [str(v) for v in payload["lora_a"]],
        "lora_b": [str(v) for v in payload["lora_b"]],
    }


def write_input_json(payload: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(to_circom_input(payload), indent=2) + "\n", encoding="utf-8")


def write_public_json(payload: dict[str, Any], path: Path) -> None:
    """Public signals matching snarkjs: logit_acc, hidden[8], borrower."""
    borrower = int(payload.get("borrower", DEMO_BORROWER_UINT))
    public = [str(payload["logit_acc"])] + [str(v) for v in payload["hidden"]] + [str(borrower)]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(public, indent=2) + "\n", encoding="utf-8")
