"""Manual Q8.8-style quantization and fixed-point inference for EZKL prep."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn

from zyocra_ml.config import QUANT_CONFIG
from zyocra_ml.lora import LoRALinear
from zyocra_ml.model import RiskMLP

# Numeric assumptions (documented in docs/quantization.md).
INPUT_VALUE_RANGE = (0.0, 1.0)  # features after min-max engineering
SCORE_VALUE_RANGE = (0.0, 1.0)  # sigmoid output
EPSILON = 1e-9


@dataclass(frozen=True)
class QuantConfig:
    """Fixed-point profile aligned with frontend / circuit placeholders."""

    profile: str
    weight_scale: int
    activation_scale: int
    accumulator_bits: int

    @classmethod
    def from_dict(cls, data: dict[str, int | str]) -> QuantConfig:
        return cls(
            profile=str(data["profile"]),
            weight_scale=int(data["weight_scale"]),
            activation_scale=int(data["activation_scale"]),
            accumulator_bits=int(data["accumulator_bits"]),
        )

    @classmethod
    def default(cls) -> QuantConfig:
        return cls.from_dict(QUANT_CONFIG)

    def to_dict(self) -> dict[str, int | str]:
        return asdict(self)


@dataclass
class QuantizedLayer:
    name: str
    weight_q: np.ndarray  # int32, shape (out, in)
    bias: np.ndarray  # float32, shape (out,)


@dataclass
class QuantizedModel:
    config: QuantConfig
    layers: list[QuantizedLayer]
    lora_folded: bool

    def to_manifest(self) -> dict[str, Any]:
        return {
            "profile": self.config.profile,
            "scales": {
                "weight_scale": self.config.weight_scale,
                "activation_scale": self.config.activation_scale,
                "accumulator_bits": self.config.accumulator_bits,
            },
            "assumptions": {
                "input_range": list(INPUT_VALUE_RANGE),
                "score_range": list(SCORE_VALUE_RANGE),
                "bias_handling": "float32 added after integer matmul (documented approximation)",
                "sigmoid_handling": "evaluated in float32 after final linear (documented approximation)",
                "relu_handling": "exact on dequantized pre-activation, then re-quantized activations",
                "lora_folded": self.lora_folded,
            },
            "layers": [
                {
                    "name": layer.name,
                    "weight_shape": list(layer.weight_q.shape),
                    "bias_shape": list(layer.bias.shape),
                }
                for layer in self.layers
            ],
        }


def quantization_summary() -> dict[str, int | str]:
    return QuantConfig.default().to_dict()


def quantize_array(values: np.ndarray, scale: int) -> np.ndarray:
    """Map float tensor to signed int32 fixed-point grid (value ≈ q / scale)."""
    scaled = np.round(values.astype(np.float64) * scale)
    return np.clip(scaled, np.iinfo(np.int32).min, np.iinfo(np.int32).max).astype(np.int32)


def dequantize_array(values_q: np.ndarray, scale: int) -> np.ndarray:
    return values_q.astype(np.float64) / scale


def _linear_weight(module: nn.Module) -> torch.Tensor:
    if isinstance(module, LoRALinear):
        return module.effective_weight.detach()
    if isinstance(module, nn.Linear):
        return module.weight.detach()
    raise TypeError(f"unsupported module for weight export: {type(module)}")


def _linear_bias(module: nn.Module) -> torch.Tensor:
    if isinstance(module, LoRALinear):
        return module.base.bias.detach()
    if isinstance(module, nn.Linear):
        return module.bias.detach()
    raise TypeError(f"unsupported module for bias export: {type(module)}")


def extract_quantized_model(model: RiskMLP, config: QuantConfig | None = None) -> QuantizedModel:
    """Quantize all Linear weights; fold LoRA into effective output weights when enabled."""
    config = config or QuantConfig.default()
    layers: list[QuantizedLayer] = []

    linear_modules: list[tuple[str, nn.Module]] = []
    idx = 0
    for module in model.backbone:
        if isinstance(module, nn.Linear):
            linear_modules.append((f"backbone.linear_{idx}", module))
            idx += 1

    linear_modules.append(("head", model.output_head))

    for name, module in linear_modules:
        weight = _linear_weight(module).cpu().numpy()
        bias = _linear_bias(module).cpu().numpy()
        layers.append(
            QuantizedLayer(
                name=name,
                weight_q=quantize_array(weight, config.weight_scale),
                bias=bias.astype(np.float32),
            )
        )

    return QuantizedModel(
        config=config,
        layers=layers,
        lora_folded=model.lora_enabled,
    )


def save_quantized_model(quantized: QuantizedModel, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "quant_config.json").write_text(
        json.dumps(quantized.to_manifest(), indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )

    payload: dict[str, Any] = {
        "config": quantized.config.to_dict(),
        "lora_folded": quantized.lora_folded,
    }
    for layer in quantized.layers:
        payload[f"{layer.name}.weight_q"] = layer.weight_q
        payload[f"{layer.name}.bias"] = layer.bias

    np.savez_compressed(out_dir / "quantized_weights.npz", **payload)


def load_quantized_model(path: Path) -> QuantizedModel:
    manifest = json.loads((path / "quant_config.json").read_text(encoding="utf-8"))
    config = QuantConfig(
        profile=manifest["profile"],
        weight_scale=int(manifest["scales"]["weight_scale"]),
        activation_scale=int(manifest["scales"]["activation_scale"]),
        accumulator_bits=int(manifest["scales"]["accumulator_bits"]),
    )
    data = np.load(path / "quantized_weights.npz")
    layers: list[QuantizedLayer] = []
    for layer_info in manifest["layers"]:
        name = layer_info["name"]
        layers.append(
            QuantizedLayer(
                name=name,
                weight_q=data[f"{name}.weight_q"],
                bias=data[f"{name}.bias"],
            )
        )
    return QuantizedModel(
        config=config,
        layers=layers,
        lora_folded=bool(data["lora_folded"]),
    )


def _clip_accumulator(values: np.ndarray, bits: int) -> np.ndarray:
    limit = (1 << (bits - 1)) - 1
    min_val = -limit - 1
    return np.clip(values, min_val, limit)


def forward_quantized_fixed_point(
    features: np.ndarray,
    quantized: QuantizedModel,
) -> np.ndarray:
    """
    Layer-wise fixed-point inference with explicit rescaling.

    Approximations (see docs/quantization.md):
    - biases applied in float32 after the integer matmul
    - ReLU on dequantized pre-activations
  - final sigmoid in float32
    """
    config = quantized.config
    batch = features.shape[0]
    x_q = quantize_array(features, config.activation_scale)

    hidden = x_q
    s_x = config.activation_scale

    for layer in quantized.layers[:-1]:
        acc = hidden.astype(np.int64) @ layer.weight_q.astype(np.int64).T
        acc = _clip_accumulator(acc, config.accumulator_bits)
        hidden_float = acc.astype(np.float64) / (s_x * config.weight_scale) + layer.bias
        hidden_float = np.maximum(hidden_float, 0.0)
        hidden = quantize_array(hidden_float, config.activation_scale)
        s_x = config.activation_scale

    head = quantized.layers[-1]
    acc = hidden.astype(np.int64) @ head.weight_q.astype(np.int64).T
    acc = _clip_accumulator(acc, config.accumulator_bits)
    logits = acc.astype(np.float64) / (s_x * config.weight_scale) + head.bias
    return (1.0 / (1.0 + np.exp(-logits))).astype(np.float32).reshape(batch, 1)


def forward_quantized_weight_only(model: RiskMLP, features: np.ndarray, config: QuantConfig | None = None) -> np.ndarray:
    """Float forward pass with dequantized weights (isolates weight-grid error)."""
    config = config or QuantConfig.default()
    quantized = extract_quantized_model(model, config)

    x = torch.from_numpy(features.astype(np.float32))
    with torch.no_grad():
        hidden = x
        layer_idx = 0
        for module in model.backbone:
            if isinstance(module, nn.ReLU):
                hidden = torch.relu(hidden)
                continue
            if isinstance(module, nn.Linear):
                q_layer = quantized.layers[layer_idx]
                weight = torch.from_numpy(
                    dequantize_array(q_layer.weight_q, config.weight_scale).astype(np.float32)
                )
                bias = torch.from_numpy(q_layer.bias)
                hidden = torch.nn.functional.linear(hidden, weight, bias)
                layer_idx += 1

        head = quantized.layers[-1]
        weight = torch.from_numpy(
            dequantize_array(head.weight_q, config.weight_scale).astype(np.float32)
        )
        bias = torch.from_numpy(head.bias)
        logits = torch.nn.functional.linear(hidden, weight, bias)
        return torch.sigmoid(logits).numpy()


def error_stats(float_out: np.ndarray, other_out: np.ndarray) -> dict[str, float]:
    """Absolute and relative error versus float reference."""
    f = float_out.reshape(-1).astype(np.float64)
    o = other_out.reshape(-1).astype(np.float64)
    abs_err = np.abs(f - o)
    rel_err = abs_err / np.maximum(np.abs(f), EPSILON)
    return {
        "mean_abs_error": float(abs_err.mean()),
        "max_abs_error": float(abs_err.max()),
        "mean_rel_error": float(rel_err.mean()),
        "max_rel_error": float(rel_err.max()),
    }
