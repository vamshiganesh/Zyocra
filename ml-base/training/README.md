# training

Phase 1 training logic lives in:

- `zyocra_ml/model.py` — `RiskMLP`
- `scripts/train.py` — base training + optional LoRA head fine-tune

```bash
source ../.venv/bin/activate  # or ml-base/.venv from repo root
python scripts/train.py
```

See [`../README.md`](../README.md) and [`../../docs/ml.md`](../../docs/ml.md).
