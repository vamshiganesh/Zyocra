# onnx-export

Phase 1 ONNX export:

```bash
python scripts/export_onnx.py
```

Output: `artifacts/onnx/zyocra-risk-mlp-v1.onnx` (+ SHA-256 in manifest).

EZKL compile uses this graph in Milestone 2 (`circuits-baseline/`).
