"""Hybrid architecture benchmark (backbone once + Circom head per update)."""

from __future__ import annotations

from typing import Any


def collect_hybrid(*, ezkl: dict[str, Any] | None, circom: dict[str, Any] | None) -> dict[str, Any] | None:
    """
    Model amortized prove cost: one EZKL full-graph prove per epoch plus
  Circom head proves per borrower/update.
    """
    if not ezkl or not circom:
        return None

    ezkl_prove = ezkl.get("prove_ms_median")
    circom_prove = circom.get("prove_ms_median")
    if ezkl_prove is None or circom_prove is None:
        return None

    updates_per_epoch = 4
    total_ms = float(ezkl_prove) + float(circom_prove) * updates_per_epoch
    amortized = total_ms / updates_per_epoch

    return {
        "scope": "Backbone once (EZKL full graph proxy) + Circom head per update",
        "assumptions": {
            "updates_per_epoch": updates_per_epoch,
            "backbone_trust": "hidden vector from backbone is trusted input to head circuit",
            "ezkl_backbone_proxy": "EZKL full-graph prove time used as backbone cost proxy",
        },
        "ezkl_full_prove_ms": ezkl_prove,
        "circom_head_prove_ms": circom_prove,
        "total_prove_ms_per_epoch": round(total_ms, 2),
        "amortized_prove_ms_per_update": round(amortized, 2),
    }
