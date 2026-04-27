#!/usr/bin/env python3
"""Compare float, quantized fixed-point, weight-only, and ONNX Runtime outputs."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import (
    FEATURES_DIR,
    MANIFESTS_DIR,
    MODEL_VERSION,
    MODELS_DIR,
    ONNX_DIR,
    QUANT_DIR,
    SAMPLES_DIR,
    VALIDATION_DIR,
)
from zyocra_ml.dataset import load_npz_split
from zyocra_ml.inference import load_risk_mlp
from zyocra_ml.manifest import build_manifest, write_manifest
from zyocra_ml.quantization import (
    error_stats,
    forward_quantized_fixed_point,
    forward_quantized_weight_only,
    load_quantized_model,
    quantization_summary,
)


def forward_float(model, features: np.ndarray) -> np.ndarray:
    with torch.no_grad():
        x = torch.from_numpy(features.astype(np.float32))
        return model(x).numpy()


def forward_onnx(onnx_path: Path, features: np.ndarray) -> np.ndarray:
    session = ort.InferenceSession(onnx_path.as_posix(), providers=["CPUExecutionProvider"])
    input_meta = session.get_inputs()[0]
    input_name = input_meta.name
    shape = input_meta.shape
    batch_fixed = isinstance(shape[0], int) and shape[0] == 1
    if batch_fixed and features.shape[0] != 1:
        rows = [session.run(None, {input_name: features[i : i + 1].astype(np.float32)})[0] for i in range(len(features))]
        return np.concatenate(rows, axis=0)
    outputs = session.run(None, {input_name: features.astype(np.float32)})
    return outputs[0]


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare native, quantized, and ONNX outputs")
    parser.add_argument("--features", type=Path, default=FEATURES_DIR)
    parser.add_argument("--checkpoint", type=Path, default=MODELS_DIR / f"{MODEL_VERSION}.pt")
    parser.add_argument("--quant", type=Path, default=QUANT_DIR)
    parser.add_argument("--onnx", type=Path, default=ONNX_DIR / f"{MODEL_VERSION}.onnx")
    parser.add_argument("--out-dir", type=Path, default=VALIDATION_DIR)
    parser.add_argument("--sample-out", type=Path, default=SAMPLES_DIR / "quantization-error-v1.json")
    parser.add_argument("--max-rows", type=int, default=0, help="0 = full test split")
    args = parser.parse_args()

    for path, label in (
        (args.checkpoint, "checkpoint"),
        (args.quant / "quantized_weights.npz", "quantized weights"),
        (args.onnx, "onnx"),
    ):
        if not path.exists():
            raise SystemExit(f"missing {label}: {path}")

    features, _labels = load_npz_split(args.features / "test.npz")
    if args.max_rows > 0:
        features = features[: args.max_rows]

    model = load_risk_mlp(args.checkpoint)
    quantized = load_quantized_model(args.quant)

    float_out = forward_float(model, features)
    weight_only_out = forward_quantized_weight_only(model, features)
    fixed_point_out = forward_quantized_fixed_point(features, quantized)
    onnx_out = forward_onnx(args.onnx, features)

    per_sample = []
    for i in range(len(features)):
        per_sample.append(
            {
                "index": i,
                "float": float(float_out[i, 0]),
                "quantized_weight_only": float(weight_only_out[i, 0]),
                "quantized_fixed_point": float(fixed_point_out[i, 0]),
                "onnx": float(onnx_out[i, 0]),
                "abs_error_onnx": float(abs(float_out[i, 0] - onnx_out[i, 0])),
                "abs_error_fixed_point": float(abs(float_out[i, 0] - fixed_point_out[i, 0])),
            }
        )

    summary = {
        "float_vs_onnx": error_stats(float_out, onnx_out),
        "float_vs_quantized_weight_only": error_stats(float_out, weight_only_out),
        "float_vs_quantized_fixed_point": error_stats(float_out, fixed_point_out),
        "onnx_vs_quantized_fixed_point": error_stats(onnx_out, fixed_point_out),
    }

    args.out_dir.mkdir(parents=True, exist_ok=True)
    comparison_path = args.out_dir / "output_comparison.json"
    comparison_path.write_text(
        json.dumps({"summary": summary, "per_sample": per_sample}, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    csv_path = args.out_dir / "output_comparison.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=[
                "index",
                "float",
                "quantized_weight_only",
                "quantized_fixed_point",
                "onnx",
                "abs_error_onnx",
                "abs_error_fixed_point",
            ],
        )
        writer.writeheader()
        writer.writerows(per_sample)

    manifest = build_manifest(
        model_version=MODEL_VERSION,
        parameter_counts=model.count_parameters(),
        quantization_config=quantization_summary(),
        metrics={
            "float_vs_onnx_mean_abs": summary["float_vs_onnx"]["mean_abs_error"],
            "float_vs_onnx_max_abs": summary["float_vs_onnx"]["max_abs_error"],
            "float_vs_fixed_point_mean_abs": summary["float_vs_quantized_fixed_point"]["mean_abs_error"],
            "float_vs_fixed_point_max_abs": summary["float_vs_quantized_fixed_point"]["max_abs_error"],
        },
        extra={
            "validation_dir": str(args.out_dir.relative_to(ROOT)),
            "comparison_json": str(comparison_path.relative_to(ROOT)),
            "comparison_csv": str(csv_path.relative_to(ROOT)),
            "test_rows": len(features),
            "summary": summary,
        },
    )
    write_manifest(args.out_dir / "validation-latest.json", manifest)
    write_manifest(MANIFESTS_DIR / "validation-latest.json", manifest)
    write_manifest(args.sample_out, manifest)

    print(json.dumps(summary, indent=2))
    print(f"wrote {comparison_path}")
    print(f"wrote {csv_path}")


if __name__ == "__main__":
    main()
