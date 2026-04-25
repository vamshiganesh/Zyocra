"""Feature engineering for tabular DeFi risk inputs."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np

from zyocra_ml.config import FEATURE_NAMES


@dataclass(frozen=True)
class FeatureStats:
    """Per-feature min/max used for deterministic [0, 1] scaling."""

    mins: dict[str, float]
    maxs: dict[str, float]

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, sort_keys=True)

    @classmethod
    def from_json(cls, raw: str) -> FeatureStats:
        data = json.loads(raw)
        return cls(mins=data["mins"], maxs=data["maxs"])

    @classmethod
    def from_arrays(cls, raw: np.ndarray) -> FeatureStats:
        mins = {name: float(raw[:, i].min()) for i, name in enumerate(FEATURE_NAMES)}
        maxs = {name: float(raw[:, i].max()) for i, name in enumerate(FEATURE_NAMES)}
        return cls(mins=mins, maxs=maxs)


def scale_features(raw: np.ndarray, stats: FeatureStats) -> np.ndarray:
    """Min-max scale each column to [0, 1] using training-derived bounds."""
    scaled = np.zeros_like(raw, dtype=np.float32)
    for i, name in enumerate(FEATURE_NAMES):
        lo = stats.mins[name]
        hi = stats.maxs[name]
        if hi <= lo:
            scaled[:, i] = 0.0
        else:
            scaled[:, i] = (raw[:, i] - lo) / (hi - lo)
    return np.clip(scaled, 0.0, 1.0)


def save_feature_stats(stats: FeatureStats, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(stats.to_json(), encoding="utf-8")


def load_feature_stats(path: Path) -> FeatureStats:
    return FeatureStats.from_json(path.read_text(encoding="utf-8"))
