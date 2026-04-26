from __future__ import annotations

import numpy as np
import torch

from zyocra_ml.config import SEED
from zyocra_ml.model import RiskMLP
from zyocra_ml.quantization import (
    QuantConfig,
    dequantize_array,
    error_stats,
    extract_quantized_model,
    forward_quantized_fixed_point,
    forward_quantized_weight_only,
    quantize_array,
)
from zyocra_ml.seed import set_global_seed


def test_quantize_dequantize_roundtrip() -> None:
    values = np.array([[0.0, 0.5, 1.0]], dtype=np.float32)
    q = quantize_array(values, scale=256)
    restored = dequantize_array(q, scale=256)
    assert np.allclose(values, restored, atol=1.0 / 256)


def test_fixed_point_close_to_float_on_random_input() -> None:
    set_global_seed(SEED)
    model = RiskMLP()
    model.enable_lora(rank=4)
    features = np.random.rand(8, 6).astype(np.float32)

    quantized = extract_quantized_model(model)
    with torch.no_grad():
        float_out = model(torch.from_numpy(features)).numpy()

    fixed_out = forward_quantized_fixed_point(features, quantized)
    stats = error_stats(float_out, fixed_out)
    assert stats["max_abs_error"] < 0.15


def test_weight_only_closer_than_fixed_point() -> None:
    set_global_seed(SEED + 1)
    model = RiskMLP()
    features = np.random.rand(4, 6).astype(np.float32)
    with torch.no_grad():
        float_out = model(torch.from_numpy(features)).numpy()

    weight_only = forward_quantized_weight_only(model, features)
    quantized = extract_quantized_model(model)
    fixed = forward_quantized_fixed_point(features, quantized)

    w_err = error_stats(float_out, weight_only)["mean_abs_error"]
    f_err = error_stats(float_out, fixed)["mean_abs_error"]
    assert w_err <= f_err + 1e-6


def test_quant_config_matches_profile() -> None:
    config = QuantConfig.default()
    assert config.profile == "Q8.8"
    assert config.weight_scale == 256
    assert config.activation_scale == 128
