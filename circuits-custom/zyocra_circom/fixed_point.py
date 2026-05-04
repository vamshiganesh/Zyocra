"""Reference fixed-point arithmetic for the LoRA output-head subgraph."""

from __future__ import annotations

import numpy as np

from zyocra_circom.config import ACCUMULATOR_BITS, HIDDEN_DIM, LORA_RANK


def clip_accumulator(values: np.ndarray) -> np.ndarray:
    limit = (1 << (ACCUMULATOR_BITS - 1)) - 1
    min_val = -limit - 1
    return np.clip(values, min_val, limit)


def base_dot(hidden: np.ndarray, weight_base: np.ndarray) -> int:
    acc = int(np.dot(hidden.astype(np.int64), weight_base.astype(np.int64)))
    return int(clip_accumulator(np.array([acc], dtype=np.int64))[0])


def lora_rank_dot(hidden: np.ndarray, lora_a: np.ndarray, lora_b: np.ndarray) -> int:
    """
    Σ_r A[r] · ⟨B[r, :], hidden⟩ without materializing A @ B.

    lora_b shape: (rank, in_dim)
    """
    total = np.int64(0)
    for r in range(lora_a.shape[0]):
        row = lora_b[r]
        inner = int(np.dot(hidden.astype(np.int64), row.astype(np.int64)))
        total += np.int64(lora_a[r]) * np.int64(inner)
    clipped = clip_accumulator(np.array([total], dtype=np.int64))
    return int(clipped[0])


def logit_accumulator(
    hidden: np.ndarray,
    weight_base: np.ndarray,
    lora_a: np.ndarray,
    lora_b: np.ndarray,
) -> int:
    """Integer accumulator before bias / sigmoid dequantization."""
    base = base_dot(hidden, weight_base)
    lora = lora_rank_dot(hidden, lora_a, lora_b)
    acc = np.int64(base) + np.int64(lora)
    return int(clip_accumulator(np.array([acc], dtype=np.int64))[0])


def dequantize_logit(acc: int, activation_scale: int, weight_scale: int) -> float:
    return float(acc) / float(activation_scale * weight_scale)


def materialized_lora_dot(hidden: np.ndarray, lora_a: np.ndarray, lora_b: np.ndarray) -> int:
    """Naive W_delta = A @ B then dot — must match lora_rank_dot for valid witnesses."""
    delta = lora_a.astype(np.int64) @ lora_b.astype(np.int64)
    acc = int(np.dot(hidden.astype(np.int64), delta.astype(np.int64)))
    return int(clip_accumulator(np.array([acc], dtype=np.int64))[0])


def assert_dims(
    hidden: np.ndarray,
    weight_base: np.ndarray,
    lora_a: np.ndarray,
    lora_b: np.ndarray,
) -> None:
    if hidden.shape != (HIDDEN_DIM,):
        raise ValueError(f"hidden must be ({HIDDEN_DIM},), got {hidden.shape}")
    if weight_base.shape != (HIDDEN_DIM,):
        raise ValueError(f"weight_base must be ({HIDDEN_DIM},), got {weight_base.shape}")
    if lora_a.shape != (LORA_RANK,):
        raise ValueError(f"lora_a must be ({LORA_RANK},), got {lora_a.shape}")
    if lora_b.shape != (LORA_RANK, HIDDEN_DIM):
        raise ValueError(f"lora_b must be ({LORA_RANK}, {HIDDEN_DIM}), got {lora_b.shape}")
