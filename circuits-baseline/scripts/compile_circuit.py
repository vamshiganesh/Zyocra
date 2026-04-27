#!/usr/bin/env python3
"""Compile ONNX to EZKL circuit representation."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import COMPILED_EZKL, NETWORK_ONNX, SETTINGS_JSON
from zyocra_ezkl.pipeline import compile_circuit


def main() -> None:
    parser = argparse.ArgumentParser(description="Compile EZKL circuit")
    parser.add_argument("--model", type=Path, default=NETWORK_ONNX)
    parser.add_argument("--compiled", type=Path, default=COMPILED_EZKL)
    parser.add_argument("--settings", type=Path, default=SETTINGS_JSON)
    args = parser.parse_args()
    compile_circuit(args.model, args.compiled, args.settings)


if __name__ == "__main__":
    main()
