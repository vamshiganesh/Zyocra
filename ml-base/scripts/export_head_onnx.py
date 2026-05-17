#!/usr/bin/env python3
"""Export LoRA output head only (hidden -> logit) for comparable EZKL head benchmark."""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

import onnx
import torch
import torch.nn as nn

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import MANIFESTS_DIR, MODEL_VERSION, MODELS_DIR, ONNX_DIR, ONNX_OPSET
from zyocra_ml.inference import load_risk_mlp
from zyocra_ml.manifest import build_manifest, write_manifest
from zyocra_ml.quantization import quantization_summary


class HeadOnly(nn.Module):
    """Output head without sigmoid — matches Circom logit_acc statement."""

    def __init__(self, model: nn.Module) -> None:
        super().__init__()
        self.head = model.output_head

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.head(x)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Export LoRA head subgraph to ONNX")
    parser.add_argument("--checkpoint", type=Path, default=MODELS_DIR / f"{MODEL_VERSION}.pt")
    parser.add_argument("--out", type=Path, default=ONNX_DIR / "zyocra-head-v1.onnx")
    parser.add_argument("--manifest", type=Path, default=MANIFESTS_DIR / "export-head-latest.json")
    args = parser.parse_args()

    if not args.checkpoint.exists():
        raise SystemExit(f"checkpoint missing: {args.checkpoint} (run train.py first)")

    model = load_risk_mlp(args.checkpoint)
    head = HeadOnly(model)
    head.eval()

    hidden_dim = model.backbone[-2].out_features if hasattr(model.backbone[-2], "out_features") else 8
    dummy = torch.zeros(1, hidden_dim, dtype=torch.float32)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    torch.onnx.export(
        head,
        dummy,
        args.out,
        input_names=["hidden"],
        output_names=["logit"],
        opset_version=ONNX_OPSET,
        do_constant_folding=True,
    )

    onnx_sha256 = sha256_file(args.out)
    manifest = build_manifest(
        model_version=MODEL_VERSION,
        parameter_counts=model.count_parameters(),
        quantization_config=quantization_summary(),
        metrics={},
        extra={
            "export_kind": "onnx_head_export",
            "onnx_path": str(args.out.relative_to(ROOT)),
            "onnx_sha256": onnx_sha256,
            "onnx_opset": ONNX_OPSET,
            "input": "hidden[1,8] Q8.8 activations",
            "output": "logit[1,1] pre-sigmoid",
            "comparable_to": "circuits-custom/lora_output_head.circom",
        },
    )
    write_manifest(args.manifest, manifest)

    print(f"wrote {args.out}")
    print(f"sha256: {onnx_sha256}")


if __name__ == "__main__":
    main()
