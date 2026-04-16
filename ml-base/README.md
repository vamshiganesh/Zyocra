# ml-base

Quantized DeFi liquidation-risk model, LoRA adapters, and ONNX export for Zyocra.

## Layout

| Path | Purpose |
|------|---------|
| `training/` | Small tabular MLP / logistic-style risk model training |
| `quantization/` | Float32 baseline, fixed-point export, scales, overflow bounds, error analysis |
| `lora/` | Low-rank adapters framed as \(W' = W + AB\) |
| `onnx-export/` | Deterministic ONNX graphs for the EZKL baseline path |
| `requirements.txt` | Python deps (ONNX, EZKL API; PyTorch CPU installed via `make install`) |
| `.venv/` | Local virtualenv (gitignored) |

## Local setup

```bash
# from repo root
make install
source ml-base/.venv/bin/activate
```

Large weights and generated artifacts belong in gitignored paths or outside the repo under `~/projects/zyocra/`.

Milestone 1 implements code under these directories. Placeholders only for now.
