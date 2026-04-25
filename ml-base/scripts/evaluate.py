#!/usr/bin/env python3
"""Evaluate trained model on the held-out test split."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import FEATURES_DIR, MANIFESTS_DIR, MODEL_VERSION, MODELS_DIR, SAMPLES_DIR
from zyocra_ml.dataset import load_npz_split
from zyocra_ml.manifest import build_manifest, write_manifest
from zyocra_ml.metrics import bucket_accuracy, regression_metrics
from zyocra_ml.model import RiskMLP
from zyocra_ml.quantization import quantization_summary
from zyocra_ml.seed import set_global_seed


def load_model(checkpoint: Path) -> RiskMLP:
    payload = torch.load(checkpoint, map_location="cpu", weights_only=False)
    model = RiskMLP()
    if payload.get("lora_enabled"):
        for param in model.backbone.parameters():
            param.requires_grad = False
        model.enable_lora()
    model.load_state_dict(payload["state_dict"])
    for param in model.parameters():
        param.requires_grad = False
    model.eval()
    return model


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate risk MLP on test split")
    parser.add_argument("--features", type=Path, default=FEATURES_DIR)
    parser.add_argument("--checkpoint", type=Path, default=MODELS_DIR / f"{MODEL_VERSION}.pt")
    parser.add_argument("--out", type=Path, default=MANIFESTS_DIR / "eval-latest.json")
    parser.add_argument("--sample-out", type=Path, default=SAMPLES_DIR / "metrics-v1.json")
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args()

    set_global_seed(args.seed)

    if not args.checkpoint.exists():
        raise SystemExit(f"checkpoint missing: {args.checkpoint} (run train.py first)")

    test_x, test_y = load_npz_split(args.features / "test.npz")
    model = load_model(args.checkpoint)

    with torch.no_grad():
        preds = model(torch.from_numpy(test_x)).squeeze(1).numpy()

    metrics = regression_metrics(test_y, preds)
    metrics.update(bucket_accuracy(test_y, preds))

    manifest = build_manifest(
        model_version=MODEL_VERSION,
        parameter_counts=model.count_parameters(),
        quantization_config=quantization_summary(),
        metrics=metrics,
        extra={
            "checkpoint": str(args.checkpoint.relative_to(ROOT)),
            "test_samples": int(len(test_y)),
        },
    )
    write_manifest(args.out, manifest)
    write_manifest(args.sample_out, manifest)

    print(json.dumps(metrics, indent=2))
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
