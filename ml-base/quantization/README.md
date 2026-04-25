# quantization

Phase 1 logs the Q8.8 profile in manifests (`zyocra_ml/config.py`). Fixed-point weight export and error analysis land in a later milestone.

Current scales (aligned with UI):

| Field | Value |
|-------|-------|
| profile | Q8.8 |
| weight_scale | 256 |
| activation_scale | 128 |
| accumulator_bits | 32 |
