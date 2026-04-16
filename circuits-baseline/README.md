# circuits-baseline

EZKL baseline proving path: ONNX → circuit compilation → proof → generated EVM verifier.

## Layout

| Path | Purpose |
|------|---------|
| `ezkl/` | EZKL settings, calibration, and pipeline scripts |
| `settings/` | Committed circuit/settings JSON (small) |
| `proofs/` | Local proof artifacts (large binaries gitignored) |

## Proof statement (target)

For a committed model graph and declared public/semi-public inputs, the published risk score is the exact result of executing the exported ONNX model under the chosen quantization configuration.

Milestone 2 implements this path. Placeholders only for now.
