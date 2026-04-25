"""Evaluation metrics for risk score regression."""

from __future__ import annotations

import numpy as np


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    y_true = y_true.astype(np.float64)
    y_pred = y_pred.astype(np.float64)
    err = y_pred - y_true
    mae = float(np.mean(np.abs(err)))
    mse = float(np.mean(err**2))
    rmse = float(np.sqrt(mse))
    max_abs = float(np.max(np.abs(err)))

    # Brier score for probabilistic calibration (labels in [0, 1]).
    brier = float(np.mean((y_pred - y_true) ** 2))

    return {
        "mae": mae,
        "mse": mse,
        "rmse": rmse,
        "max_abs_error": max_abs,
        "brier_score": brier,
    }


def bucket_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    """Map scores to LOW/MEDIUM/HIGH/CRITICAL buckets (bps thresholds)."""

    def bucketize(scores: np.ndarray) -> np.ndarray:
        bps = np.clip(scores * 10_000, 0, 10_000)
        buckets = np.zeros(len(scores), dtype=np.int64)
        buckets[bps >= 5_500] = 1
        buckets[bps >= 8_000] = 2
        buckets[bps >= 9_200] = 3
        return buckets

    true_b = bucketize(y_true)
    pred_b = bucketize(y_pred)
    acc = float(np.mean(true_b == pred_b))
    return {"bucket_accuracy": acc}
