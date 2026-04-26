# Zyocra — Quantization and ONNX validation

Manual fixed-point handling for the Phase 1 tabular MLP, aligned with EZKL baseline prep. The ONNX graph remains **float32**; Q8.8 scales define a parallel fixed-point reference path for error measurement.

## Profile (Q8.8)

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `weight_scale` | 256 | Weights stored as `round(w × 256)` int32 |
| `activation_scale` | 128 | Activations re-quantized as `round(a × 128)` int32 |
| `accumulator_bits` | 32 | Matmul accumulators clipped to signed 32-bit |
| Input range | [0, 1] | After `engineer_features.py` min-max scaling |
| Output range | [0, 1] | Sigmoid risk score |

Source of truth: `zyocra_ml/config.py` → `QUANT_CONFIG`.

## Numeric assumptions

### Exact
- Weight grid: symmetric round-to-nearest on `weight_scale`
- Integer matmul: `acc = x_q @ W_q^T` in int64, clipped to `accumulator_bits`
- Rescale: `acc / (activation_scale × weight_scale)`
- ReLU: applied on dequantized pre-activation

### Approximate (documented)
| Step | Handling | Why |
|------|----------|-----|
| **Bias** | Added in float32 after integer matmul | Simplifies Phase 1; bias magnitudes are small |
| **Sigmoid** | Evaluated in float32 on final logit | Non-linear; polynomial gadget deferred to circuits |
| **LoRA** | Folded into effective head weights `W' = W + AB` before quantization | Single quantized head for proving |
| **ONNX** | Float32 export; EZKL applies its own compile-time quantization | Standard EZKL workflow |

If any of these tighten in Milestone 2, update `zyocra_ml/quantization.py` and re-run validation.

## Inference paths

| Path | Module / script | Purpose |
|------|-----------------|--------|
| **Float native** | PyTorch `RiskMLP` | Reference |
| **Weight-only quantized** | `forward_quantized_weight_only` | Isolates weight-grid error |
| **Fixed-point** | `forward_quantized_fixed_point` | Layer-wise Q8.8 simulation |
| **ONNX Runtime** | `compare_outputs.py` | Validates export vs float |

## Artifact layout

```text
ml-base/artifacts/
├── models/zyocra-risk-mlp-v1.pt
├── onnx/zyocra-risk-mlp-v1.onnx
├── quantization/
│   ├── quant_config.json      # scales + assumptions manifest
│   └── quantized_weights.npz  # int32 weights + float biases
├── validation/
│   ├── output_comparison.json # summary + per-sample rows
│   ├── output_comparison.csv
│   └── validation-latest.json
└── manifests/
    ├── export-latest.json
    └── validation-latest.json

ml-base/samples/
└── quantization-error-v1.json  # committed example metrics
```

## Scripts

From `ml-base/` with venv active:

```bash
# After train.py
python scripts/quantize_model.py
python scripts/export_onnx.py
python scripts/compare_outputs.py

# Or full pipeline including validation
bash scripts/run_pipeline.sh
```

### `compare_outputs.py`

Logs per test-row:

- `float` — native PyTorch
- `quantized_weight_only` — dequantized weights, float activations
- `quantized_fixed_point` — full manual Q8.8 path
- `onnx` — ONNX Runtime

Summary metrics:

- `mean_abs_error`, `max_abs_error`
- `mean_rel_error`, `max_rel_error` (relative to `max(|float|, ε)`)

## Benchmark alignment

These errors feed Milestone 5 **quantization accuracy** axis:

| Metric | Source |
|--------|--------|
| Float vs ONNX max abs | Export correctness |
| Float vs fixed-point mean/max abs | Circuit arithmetic drift |
| Float vs weight-only | Weight grid contribution |

Record machine profile and git commit in `benchmarks/raw-results/` when publishing numbers.

## EZKL handoff (Milestone 2)

1. Input: `artifacts/onnx/zyocra-risk-mlp-v1.onnx`
2. Reference scales: `artifacts/quantization/quant_config.json`
3. Public input: 6 scaled features in [0, 1]
4. Public output: single risk score in [0, 1]
5. Compare EZKL fixed-point settings against `float_vs_quantized_fixed_point` errors from validation manifest

## Related docs

- [`ml.md`](ml.md) — training pipeline
- [`architecture.md`](architecture.md) — system context
- `ml-base/quantization/README.md` — quick pointer
