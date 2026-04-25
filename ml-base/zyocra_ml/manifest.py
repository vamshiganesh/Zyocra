"""Run manifest logging (model version, params, quant config, metrics)."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


def build_manifest(
    *,
    model_version: str,
    parameter_counts: dict[str, int],
    quantization_config: dict[str, int | str],
    metrics: dict[str, float],
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "generated_at": datetime.now(UTC).isoformat(),
        "model_version": model_version,
        "parameter_counts": parameter_counts,
        "quantization_config": quantization_config,
        "evaluation_metrics": metrics,
    }
    if extra:
        payload.update(extra)
    return payload


def write_manifest(path: Path, manifest: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
