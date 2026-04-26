# ml-base

Quantized DeFi liquidation-risk model, LoRA adapters, and ONNX export for Zyocra.

## Layout

| Path | Purpose |
|------|---------|
| `zyocra_ml/` | Importable Python package (model, features, LoRA, metrics) |
| `scripts/` | Dataset prep, training, evaluation, ONNX export |
| `tests/` | Determinism and model unit tests |
| `samples/` | Small committed example manifests |
| `artifacts/` | Runtime outputs (gitignored) |
| `training/` | Milestone notes (logic lives in `zyocra_ml/` + `scripts/`) |
| `quantization/` | Fixed-point export (later milestone) |
| `lora/` | LoRA notes; implementation in `zyocra_ml/lora.py` |
| `onnx-export/` | ONNX notes; export script in `scripts/export_onnx.py` |
| `requirements.txt` | Python deps (PyTorch CPU via `make install`) |
| `.venv/` | Local virtualenv (gitignored) |

## Quick start

```bash
# from repo root
make install
source ml-base/.venv/bin/activate
cd ml-base
bash scripts/run_pipeline.sh
pytest -q
```

Full documentation: [`../docs/ml.md`](../docs/ml.md). Quantization: [`../docs/quantization.md`](../docs/quantization.md).

## Phase 1 outputs

After `run_pipeline.sh`:

- `artifacts/models/zyocra-risk-mlp-v1.pt`
- `artifacts/onnx/zyocra-risk-mlp-v1.onnx`
- `artifacts/manifests/eval-latest.json`
- Example copies in `samples/`
