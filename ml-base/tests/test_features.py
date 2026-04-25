from __future__ import annotations

import numpy as np

from zyocra_ml.config import FEATURE_NAMES
from zyocra_ml.dataset import generate_raw_dataset
from zyocra_ml.features import FeatureStats, scale_features


def test_scale_features_to_unit_interval() -> None:
    raw, _ = generate_raw_dataset(n_samples=256, seed=1)
    stats = FeatureStats.from_arrays(raw)
    scaled = scale_features(raw, stats)
    assert scaled.shape == raw.shape
    assert scaled.min() >= 0.0
    assert scaled.max() <= 1.0
    for i, name in enumerate(FEATURE_NAMES):
        assert name in stats.mins
        assert name in stats.maxs
