"""Quantization profile helpers (Phase 1 — config only; fixed-point export later)."""

from __future__ import annotations

from zyocra_ml.config import QUANT_CONFIG


def quantization_summary() -> dict[str, int | str]:
    return dict(QUANT_CONFIG)
