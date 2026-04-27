#!/usr/bin/env python3
"""Generate EZKL settings.json from ONNX."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import NETWORK_ONNX, SETTINGS_JSON
from zyocra_ezkl.pipeline import gen_settings, prepare_onnx


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate EZKL settings")
    parser.add_argument("--model", type=Path, default=NETWORK_ONNX)
    parser.add_argument("--settings", type=Path, default=SETTINGS_JSON)
    parser.add_argument("--skip-prepare", action="store_true")
    args = parser.parse_args()
    if not args.skip_prepare:
        prepare_onnx()
    gen_settings(args.model, args.settings)


if __name__ == "__main__":
    main()
