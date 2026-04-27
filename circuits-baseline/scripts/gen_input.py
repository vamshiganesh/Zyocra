#!/usr/bin/env python3
"""Write sample input JSON from ml-base test features."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import SAMPLE_INPUT
from zyocra_ezkl.pipeline import load_sample_features, write_input_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Build EZKL input JSON")
    parser.add_argument("--out", type=Path, default=SAMPLE_INPUT)
    parser.add_argument("--sample-index", type=int, default=0)
    args = parser.parse_args()
    features = load_sample_features(args.sample_index)
    write_input_json(features, args.out)
    print(f"features: {features.reshape(-1).tolist()}")


if __name__ == "__main__":
    main()
