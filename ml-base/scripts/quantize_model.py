#!/usr/bin/env python3
"""Export quantized weights and manifest for fixed-point / EZKL reference."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import MODEL_VERSION, MODELS_DIR, QUANT_DIR
from zyocra_ml.inference import load_risk_mlp
from zyocra_ml.quantization import QuantConfig, extract_quantized_model, save_quantized_model


def main() -> None:
    parser = argparse.ArgumentParser(description="Quantize trained model weights (Q8.8 profile)")
    parser.add_argument("--checkpoint", type=Path, default=MODELS_DIR / f"{MODEL_VERSION}.pt")
    parser.add_argument("--out", type=Path, default=QUANT_DIR)
    args = parser.parse_args()

    if not args.checkpoint.exists():
        raise SystemExit(f"checkpoint missing: {args.checkpoint} (run train.py first)")

    model = load_risk_mlp(args.checkpoint)
    config = QuantConfig.default()
    quantized = extract_quantized_model(model, config)
    save_quantized_model(quantized, args.out)

    print(f"wrote {args.out / 'quant_config.json'}")
    print(f"wrote {args.out / 'quantized_weights.npz'}")
    print(f"layers: {len(quantized.layers)} · lora_folded={quantized.lora_folded}")


if __name__ == "__main__":
    main()
