#!/usr/bin/env python3
"""Export trained model to ONNX for the EZKL baseline path."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import MANIFESTS_DIR, MODEL_VERSION, MODELS_DIR, ONNX_DIR, ONNX_OPSET, SAMPLES_DIR
from zyocra_ml.manifest import build_manifest, write_manifest
from zyocra_ml.model import RiskMLP
from zyocra_ml.quantization import quantization_summary


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


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Export risk MLP to ONNX")
    parser.add_argument("--checkpoint", type=Path, default=MODELS_DIR / f"{MODEL_VERSION}.pt")
    parser.add_argument("--out", type=Path, default=ONNX_DIR / f"{MODEL_VERSION}.onnx")
    parser.add_argument("--manifest", type=Path, default=MANIFESTS_DIR / "export-latest.json")
    parser.add_argument("--sample-out", type=Path, default=SAMPLES_DIR / "manifest-v1.json")
    args = parser.parse_args()

    if not args.checkpoint.exists():
        raise SystemExit(f"checkpoint missing: {args.checkpoint} (run train.py first)")

    model = load_model(args.checkpoint)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    dummy = torch.zeros(1, 6, dtype=torch.float32)
    torch.onnx.export(
        model,
        dummy,
        args.out,
        input_names=["features"],
        output_names=["risk_score"],
        dynamic_axes={"features": {0: "batch"}, "risk_score": {0: "batch"}},
        opset_version=ONNX_OPSET,
    )

    onnx_sha256 = sha256_file(args.out)
    manifest = build_manifest(
        model_version=MODEL_VERSION,
        parameter_counts=model.count_parameters(),
        quantization_config=quantization_summary(),
        metrics={},
        extra={
            "onnx_path": str(args.out.relative_to(ROOT)),
            "onnx_sha256": onnx_sha256,
            "onnx_opset": ONNX_OPSET,
            "input_shape": [1, 6],
            "output_shape": [1, 1],
        },
    )
    write_manifest(args.manifest, manifest)
    write_manifest(args.sample_out, manifest)

    print(f"wrote {args.out}")
    print(f"sha256: {onnx_sha256}")
    print(f"wrote manifest {args.manifest}")


if __name__ == "__main__":
    main()
