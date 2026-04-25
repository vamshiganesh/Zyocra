from __future__ import annotations

import numpy as np

from zyocra_ml.config import SEED
from zyocra_ml.dataset import generate_raw_dataset
from zyocra_ml.seed import set_global_seed


def test_generate_raw_dataset_is_deterministic() -> None:
    a_x, a_y = generate_raw_dataset(n_samples=128, seed=SEED)
    b_x, b_y = generate_raw_dataset(n_samples=128, seed=SEED)
    assert np.allclose(a_x, b_x)
    assert np.allclose(a_y, b_y)


def test_labels_are_bounded() -> None:
    _, labels = generate_raw_dataset(n_samples=64, seed=SEED)
    assert labels.min() >= 0.0
    assert labels.max() <= 1.0


def test_different_seeds_differ() -> None:
    set_global_seed(SEED)
    x1, _ = generate_raw_dataset(n_samples=32, seed=SEED)
    x2, _ = generate_raw_dataset(n_samples=32, seed=SEED + 1)
    assert not np.allclose(x1, x2)
