#!/usr/bin/env python3
"""Prepare ONNX for EZKL (inline weights, static batch)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import NETWORK_ONNX, ONNX_SRC
from zyocra_ezkl.pipeline import prepare_onnx


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare ONNX for EZKL")
    parser.add_argument("--src", type=Path, default=ONNX_SRC)
    parser.add_argument("--dest", type=Path, default=NETWORK_ONNX)
    args = parser.parse_args()
    prepare_onnx(args.src, args.dest)


if __name__ == "__main__":
    main()
