"""Central configuration for deterministic ML pipeline runs."""

from __future__ import annotations

from pathlib import Path

# Repo-relative paths (ml-base is package root).
ML_ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS_DIR = ML_ROOT / "artifacts"
DATA_DIR = ARTIFACTS_DIR / "data"
FEATURES_DIR = ARTIFACTS_DIR / "features"
MODELS_DIR = ARTIFACTS_DIR / "models"
MANIFESTS_DIR = ARTIFACTS_DIR / "manifests"
ONNX_DIR = ARTIFACTS_DIR / "onnx"
QUANT_DIR = ARTIFACTS_DIR / "quantization"
VALIDATION_DIR = ARTIFACTS_DIR / "validation"
SAMPLES_DIR = ML_ROOT / "samples"

MODEL_VERSION = "zyocra-risk-mlp-v1"

# Fixed global seed — all scripts call set_global_seed(SEED).
SEED = 2026_041

# Tabular feature schema (aligned with frontend input summary).
FEATURE_NAMES: tuple[str, ...] = (
    "collateralization_ratio",
    "debt_utilization",
    "volatility_proxy_7d",
    "liquidation_proximity",
    "borrow_concentration",
    "wallet_age_days",
)

# Small MLP — sized for local zk proving experiments.
HIDDEN_DIMS: tuple[int, ...] = (16, 8)
LORA_RANK = 4

TRAIN_FRACTION = 0.70
VAL_FRACTION = 0.15
# Remainder is test.

# Synthetic dataset size (local-only, no external APIs).
SYNTHETIC_SAMPLES = 2_048

# Training hyperparameters (CPU-friendly).
EPOCHS = 40
BATCH_SIZE = 64
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4

# Phase 1 quantization profile (full fixed-point export in a later milestone).
QUANT_CONFIG: dict[str, int | str] = {
    "profile": "Q8.8",
    "weight_scale": 256,
    "activation_scale": 128,
    "accumulator_bits": 32,
}

ONNX_OPSET = 18
