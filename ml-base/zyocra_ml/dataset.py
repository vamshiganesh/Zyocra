"""Synthetic tabular dataset generation (local, deterministic)."""

from __future__ import annotations

import csv
from pathlib import Path

import numpy as np

from zyocra_ml.config import FEATURE_NAMES, SEED, SYNTHETIC_SAMPLES
from zyocra_ml.seed import set_global_seed


def _risk_score_from_features(features: np.ndarray) -> np.ndarray:
    """
    Generate a synthetic liquidation-risk label in [0, 1] from engineered correlations.

    Higher debt utilization, volatility, and borrow concentration increase risk;
    higher collateralization and liquidation proximity reduce it.
    """
    col = {name: i for i, name in enumerate(FEATURE_NAMES)}
    logits = (
        -1.4 * features[:, col["collateralization_ratio"]]
        + 2.0 * features[:, col["debt_utilization"]]
        + 1.6 * features[:, col["volatility_proxy_7d"]]
        - 1.8 * features[:, col["liquidation_proximity"]]
        + 0.9 * features[:, col["borrow_concentration"]]
        - 0.4 * features[:, col["wallet_age_days"]]
        + 0.35
    )
    logits = np.clip(logits, -30.0, 30.0)
    return (1.0 / (1.0 + np.exp(-logits))).astype(np.float32).clip(0.0, 1.0)


def generate_raw_dataset(n_samples: int = SYNTHETIC_SAMPLES, seed: int = SEED) -> tuple[np.ndarray, np.ndarray]:
    """Return (features, labels) with raw (unscaled) feature columns."""
    set_global_seed(seed)
    rng = np.random.default_rng(seed)

    n = n_samples
    features = np.column_stack(
        [
            rng.uniform(0.8, 2.5, n),  # collateralization_ratio
            rng.uniform(0.0, 1.0, n),  # debt_utilization
            rng.uniform(0.05, 0.65, n),  # volatility_proxy_7d
            rng.uniform(0.0, 1.0, n),  # liquidation_proximity
            rng.uniform(0.1, 0.9, n),  # borrow_concentration
            rng.uniform(30.0, 800.0, n),  # wallet_age_days
        ]
    ).astype(np.float32)

    labels = _risk_score_from_features(features)
    return features, labels


def write_raw_csv(path: Path, features: np.ndarray, labels: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow([*FEATURE_NAMES, "risk_score"])
        for row, label in zip(features, labels, strict=True):
            writer.writerow([*(f"{v:.6f}" for v in row), f"{label:.6f}"])


def deterministic_split(
    n_samples: int,
    train_fraction: float,
    val_fraction: float,
    seed: int,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Return train, validation, and test index arrays (disjoint, shuffled)."""
    rng = np.random.default_rng(seed)
    indices = np.arange(n_samples)
    rng.shuffle(indices)

    train_end = int(n_samples * train_fraction)
    val_end = train_end + int(n_samples * val_fraction)
    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]
    return train_idx, val_idx, test_idx


def save_npz_split(path: Path, features: np.ndarray, labels: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(path, features=features, labels=labels)


def load_npz_split(path: Path) -> tuple[np.ndarray, np.ndarray]:
    data = np.load(path)
    return data["features"], data["labels"]


def read_raw_csv(path: Path) -> tuple[np.ndarray, np.ndarray]:
    with path.open(encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)

    features = np.array(
        [[float(row[name]) for name in FEATURE_NAMES] for row in rows],
        dtype=np.float32,
    )
    labels = np.array([float(row["risk_score"]) for row in rows], dtype=np.float32)
    return features, labels
