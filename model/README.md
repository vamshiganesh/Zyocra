# model

Quantized risk model and LoRA-style adapter exports for Zyocra.

## Local setup

```bash
# from repo root
make install
source model/.venv/bin/activate
```

Python dependencies live in `requirements.txt` (PyTorch CPU, ONNX, EZKL Python package).

Large weights and generated artifacts belong in `model/artifacts/` (gitignored) or outside the repo under `~/projects/zyocra/`.
