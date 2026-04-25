# Zyocra — ML pipeline (Phase 1)

Off-chain machine learning for the verifiable LoRA risk oracle: a **small tabular MLP** trained on **synthetic, deterministic** borrower features. No paid APIs, no cloud — runs entirely in `ml-base/.venv`.

## Goals

| Goal | Phase 1 approach |
|------|------------------|
| Reproducibility | Global seed `2026041`, deterministic algorithms, fixed splits |
| zk-friendly size | 6 inputs → 16 → 8 → 1 sigmoid (~300 trainable params base) |
| LoRA readiness | Optional low-rank adapter on output head (`W' = W + AB`) |
| EZKL path | ONNX export with documented SHA-256 |
| Quantization | Config logged now; fixed-point export in a later milestone |

## Package layout

```text
ml-base/
├── zyocra_ml/              # importable Python package
│   ├── config.py           # version, seeds, hyperparameters, quant profile
│   ├── dataset.py          # synthetic data + splits
│   ├── features.py         # min-max scaling
│   ├── model.py            # RiskMLP
│   ├── lora.py             # LoRALinear (W' = W + AB)
│   ├── metrics.py          # regression + bucket accuracy
│   ├── manifest.py         # JSON run manifests
│   └── quantization.py     # Q8.8 profile stub
├── scripts/
│   ├── prepare_dataset.py
│   ├── engineer_features.py
│   ├── train.py
│   ├── evaluate.py
│   ├── export_onnx.py
│   └── run_pipeline.sh     # runs all steps
├── tests/
├── samples/                # committed example manifests (small)
└── artifacts/              # gitignored runtime outputs
```

## Feature schema

Aligned with the frontend Input Summary screen:

| Feature | Description |
|---------|-------------|
| `collateralization_ratio` | Collateral / debt |
| `debt_utilization` | Borrowed / limit (0–1) |
| `volatility_proxy_7d` | 7-day vol proxy |
| `liquidation_proximity` | Distance to liquidation (0 = at risk) |
| `borrow_concentration` | Wallet-level concentration |
| `wallet_age_days` | Days since first activity |

Labels: synthetic **liquidation risk score** in `[0, 1]` from a fixed logistic mapping (deterministic given seed).

## Model

**`RiskMLP`** — two hidden ReLU layers (16, 8), sigmoid output.

**LoRA (optional):** after base training, the output `Linear` is wrapped with `LoRALinear` rank `4`. Base weights are frozen; only `A` and `B` train for 10 epochs. This matches the project framing \(W' = W + AB\) without complicating the first baseline.

## Scripts

Activate the venv first:

```bash
make install
source ml-base/.venv/bin/activate
cd ml-base
```

| Script | Purpose |
|--------|---------|
| `prepare_dataset.py` | Generate `artifacts/data/raw.csv` (2048 synthetic rows) |
| `engineer_features.py` | Min-max scale + 70/15/15 train/val/test → `artifacts/features/*.npz` |
| `train.py` | Train base MLP + LoRA head → `artifacts/models/zyocra-risk-mlp-v1.pt` |
| `evaluate.py` | Test metrics → `artifacts/manifests/eval-latest.json` |
| `export_onnx.py` | ONNX graph → `artifacts/onnx/zyocra-risk-mlp-v1.onnx` |

**Full pipeline:**

```bash
bash scripts/run_pipeline.sh
```

## Artifact locations

| Path | Committed? | Contents |
|------|------------|----------|
| `artifacts/data/raw.csv` | No | Synthetic raw features + labels |
| `artifacts/features/` | No | Scaled splits + `feature_stats.json` |
| `artifacts/models/*.pt` | No | PyTorch checkpoints |
| `artifacts/manifests/` | No | Per-step JSON manifests |
| `artifacts/onnx/*.onnx` | No | ONNX graph for EZKL |
| `samples/manifest-v1.json` | Yes | Example export manifest |
| `samples/metrics-v1.json` | Yes | Example evaluation metrics |
| `samples/features-head.csv` | Yes | First 10 raw rows (illustrative) |

## Manifest fields

Each manifest JSON includes:

- `model_version` — e.g. `zyocra-risk-mlp-v1`
- `parameter_counts` — `total`, `trainable`, `frozen`
- `quantization_config` — `Q8.8`, weight/activation scales
- `evaluation_metrics` — MAE, RMSE, Brier, bucket accuracy (when applicable)
- `onnx_sha256` — after export

## Quantization profile (Phase 1)

Logged for circuit alignment; not yet applied to weights:

```json
{
  "profile": "Q8.8",
  "weight_scale": 256,
  "activation_scale": 128,
  "accumulator_bits": 32
}
```

Matches UI copy in `frontend/src/data/product-placeholders.ts`.

## Tests

```bash
cd ml-base
pytest -q
```

From repo root: `make test` runs pytest when `ml-base/tests/` exists.

## Milestone 2+ wiring

1. Point EZKL at `artifacts/onnx/zyocra-risk-mlp-v1.onnx`
2. Use `onnx_sha256` and adapter commitments for oracle `modelHash` / `adapterHash`
3. Implement fixed-point export under `quantization/` using the logged scales
4. Replace synthetic data with reproducible public/semi-synthetic datasets when ready

## Design choices

- **Synthetic data first** — removes external API dependency; correlations are explicit and reproducible.
- **Small MLP** — constraint count stays tractable for local proving experiments.
- **LoRA on head only** — clean \(W' = W + AB\) story without refactoring the full backbone.
- **Determinism over accuracy** — Phase 1 optimizes for a stable baseline, not SOTA risk modeling.
