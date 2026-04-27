#!/usr/bin/env python3
"""Export trained model to ONNX for the EZKL baseline path."""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import MANIFESTS_DIR, MODEL_VERSION, MODELS_DIR, ONNX_DIR, ONNX_OPSET, SAMPLES_DIR
from zyocra_ml.inference import load_risk_mlp
from zyocra_ml.manifest import build_manifest, write_manifest
from zyocra_ml.quantization import quantization_summary


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
    parser.add_argument(
        "--static-batch",
        action="store_true",
        help="Export fixed batch=1 graph (useful for some EZKL compile paths)",
    )
    args = parser.parse_args()

    if not args.checkpoint.exists():
        raise SystemExit(f"checkpoint missing: {args.checkpoint} (run train.py first)")

    model = load_risk_mlp(args.checkpoint)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    dummy = torch.zeros(1, 6, dtype=torch.float32)
    export_kwargs: dict = {
        "input_names": ["features"],
        "output_names": ["risk_score"],
        "opset_version": ONNX_OPSET,
    }
    if not args.static_batch:
        export_kwargs["dynamic_axes"] = {"features": {0: "batch"}, "risk_score": {0: "batch"}}

    onnx.save(model, args.out, save_as_external_data=False)

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
            "dtype": "float32",
            "static_batch": args.static_batch,
            "note": "ONNX graph is float32; Q8.8 scales apply to manual fixed-point reference path",
        },
    )
    write_manifest(args.manifest, manifest)
    write_manifest(args.sample_out, manifest)

    print(f"wrote {args.out}")
    print(f"sha256: {onnx_sha256}")
    print(f"wrote manifest {args.manifest}")


if __name__ == "__main__":
    main()
