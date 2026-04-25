#!/usr/bin/env python3
"""Scale features and write train / val / test splits."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ml.config import (
    DATA_DIR,
    FEATURES_DIR,
    SEED,
    TRAIN_FRACTION,
    VAL_FRACTION,
)
from zyocra_ml.dataset import (
    deterministic_split,
    load_npz_split,
    read_raw_csv,
    save_npz_split,
)
from zyocra_ml.features import FeatureStats, save_feature_stats, scale_features


def engineer(raw_path: Path, out_dir: Path, seed: int) -> FeatureStats:
    features, labels = read_raw_csv(raw_path)
    train_idx, val_idx, test_idx = deterministic_split(
        len(labels), TRAIN_FRACTION, VAL_FRACTION, seed
    )

    stats = FeatureStats.from_arrays(features[train_idx])
    save_feature_stats(stats, out_dir / "feature_stats.json")

    for name, idx in ("train", train_idx), ("val", val_idx), ("test", test_idx):
        scaled = scale_features(features[idx], stats)
        save_npz_split(out_dir / f"{name}.npz", scaled, labels[idx])

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Engineer and split scaled features")
    parser.add_argument("--raw", type=Path, default=DATA_DIR / "raw.csv")
    parser.add_argument("--out", type=Path, default=FEATURES_DIR)
    parser.add_argument("--seed", type=int, default=SEED)
    args = parser.parse_args()

    if not args.raw.exists():
        raise SystemExit(f"raw dataset missing: {args.raw} (run prepare_dataset.py first)")

    stats = engineer(args.raw, args.out, args.seed)
    train_x, train_y = load_npz_split(args.out / "train.npz")
    print(f"wrote splits to {args.out}")
    print(f"  train={len(train_y)} val stats from {len(stats.mins)} features")


if __name__ == "__main__":
    main()
