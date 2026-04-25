#!/usr/bin/env python3
"""Generate a deterministic synthetic borrower dataset (no external APIs)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import DATA_DIR, SEED, SYNTHETIC_SAMPLES
from zyocra_ml.dataset import generate_raw_dataset, write_raw_csv


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare synthetic DeFi risk dataset")
    parser.add_argument("--samples", type=int, default=SYNTHETIC_SAMPLES)
    parser.add_argument("--seed", type=int, default=SEED)
    parser.add_argument("--out", type=Path, default=DATA_DIR / "raw.csv")
    args = parser.parse_args()

    features, labels = generate_raw_dataset(n_samples=args.samples, seed=args.seed)
    write_raw_csv(args.out, features, labels)
    print(f"wrote {args.out} ({len(labels)} rows)")


if __name__ == "__main__":
    main()
