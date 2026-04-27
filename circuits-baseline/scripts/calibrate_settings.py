#!/usr/bin/env python3
"""Optional EZKL settings calibration (slow on CPU)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import NETWORK_ONNX, SAMPLE_INPUT, SETTINGS_JSON
from zyocra_ezkl.pipeline import calibrate_settings, load_sample_features, write_input_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Calibrate EZKL settings (optional)")
    parser.add_argument("--input", type=Path, default=SAMPLE_INPUT)
    parser.add_argument("--model", type=Path, default=NETWORK_ONNX)
    parser.add_argument("--settings", type=Path, default=SETTINGS_JSON)
    parser.add_argument("--sample-index", type=int, default=0)
    args = parser.parse_args()

    if not args.input.exists():
        features = load_sample_features(args.sample_index)
        write_input_json(features, args.input)

    calibrate_settings(args.input, args.model, args.settings)


if __name__ == "__main__":
    main()
