"""Tests for LoRA head fixed-point reference math."""

from __future__ import annotations

import numpy as np
import pytest

from zyocra_circom.fixed_point import (
    assert_dims,
    base_dot,
    logit_accumulator,
    lora_rank_dot,
    materialized_lora_dot,
)
from zyocra_circom.weights import build_witness_payload, synthetic_fixture


def test_lora_rank_dot_matches_materialized() -> None:
    payload = synthetic_fixture(seed=42)
    hidden = np.array(payload["hidden"], dtype=np.int32)
    lora_a = np.array(payload["lora_a"], dtype=np.int32)
    lora_b = np.array(payload["lora_b"], dtype=np.int32).reshape(4, 8)
    weight_base = np.array(payload["weight_base"], dtype=np.int32)

    assert_dims(hidden, weight_base, lora_a, lora_b)
    assert lora_rank_dot(hidden, lora_a, lora_b) == materialized_lora_dot(hidden, lora_a, lora_b)


def test_logit_accumulator_matches_payload() -> None:
    payload = synthetic_fixture(seed=99)
    hidden = np.array(payload["hidden"], dtype=np.int32)
    lora_a = np.array(payload["lora_a"], dtype=np.int32)
    lora_b = np.array(payload["lora_b"], dtype=np.int32).reshape(4, 8)
    weight_base = np.array(payload["weight_base"], dtype=np.int32)

    acc = logit_accumulator(hidden, weight_base, lora_a, lora_b)
    assert acc == payload["logit_acc"]


def test_build_witness_payload_recomputes_acc() -> None:
    payload = synthetic_fixture(seed=7)
    rebuilt = build_witness_payload(
        np.array(payload["hidden"], dtype=np.int32),
        np.array(payload["weight_base"], dtype=np.int32),
        np.array(payload["lora_a"], dtype=np.int32),
        np.array(payload["lora_b"], dtype=np.int32).reshape(4, 8),
        source="test",
    )
    assert rebuilt["logit_acc"] == payload["logit_acc"]


def test_base_dot_is_commutative_grid() -> None:
    a = np.array([3, -2, 5, 1, 0, 4, -1, 2], dtype=np.int32)
    b = np.array([2, 1, -3, 4, 5, -2, 1, 0], dtype=np.int32)
    assert base_dot(a, b) == int(np.dot(a.astype(np.int64), b.astype(np.int64)))
