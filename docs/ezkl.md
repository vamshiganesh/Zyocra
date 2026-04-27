# EZKL baseline pipeline

End-to-end verifiable inference for the Phase 1 risk MLP using [EZKL](https://github.com/zkonduit/ezkl) **23.0.5**.

## Prerequisites

1. `make install` from repo root (creates `ml-base/.venv` with `ezkl==23.0.5`).
2. ML artifacts from the Phase 1 pipeline:

```bash
cd ml-base && bash scripts/run_pipeline.sh
```

This produces `ml-base/artifacts/onnx/zyocra-risk-mlp-v1.onnx` (static batch=1, inlined weights).

Always use the venv Python:

```bash
PYTHON=ml-base/.venv/bin/python
```

## Pinned version

| Component | Version |
|-----------|---------|
| ezkl | **23.0.5** (`ml-base/requirements.txt`) |

Verify:

```bash
ml-base/.venv/bin/python -c "import ezkl; print(ezkl.__version__)"
```

## Artifact layout

```
circuits-baseline/
├── onnx/zyocra-risk-mlp-v1.onnx   # inlined copy from ml-base
├── settings/settings.json         # EZKL run args + graph metadata
├── settings/network.ezkl          # compiled circuit (~few MB)
├── settings/sample-input.json     # demo input (6 features)
├── keys/kzg.srs                   # ~16 MB (gen_srs, logrows=17)
├── keys/vk.key                    # verification key
├── keys/pk.key                    # proving key (~600 MB)
├── witnesses/witness.json
├── proofs/proof.json
├── proofs/oracle-payload.json     # RiskOracle-ready payload
├── verifiers/RiskScoreVerifier.sol
└── logs/demo-latest.json
```

Large binaries are gitignored; rerun the pipeline to regenerate.

## One-shot pipeline

```bash
bash circuits-baseline/scripts/run_pipeline.sh
```

## Step-by-step commands

All commands run from **repo root** unless noted.

### 1. Prepare ONNX

Copies ml-base ONNX and inlines external weights (EZKL tract requirement).

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/prepare_onnx.py
```

### 2. Generate settings

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/gen_settings.py
```

Run args (in `zyocra_ezkl/pipeline.py`):

- `input_visibility=public`, `output_visibility=public`, `param_visibility=fixed`
- `input_scale=7`, `param_scale=7` (multiply by 128 — matches ml-base Q8.8 activation scale)
- `logrows=17`

EZKL may warn that scale &lt; 8 can affect precision. This is expected for our Q8.8 alignment.

### 3. Calibrate settings (optional)

Can improve resource estimates; **slow on CPU** (minutes). Skip for baseline demos.

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/calibrate_settings.py
```

### 4. Compile circuit

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/compile_circuit.py
```

### 5. Setup (SRS + keys)

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/setup.py
```

SRS only (reuse if keys already exist):

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/setup.py --srs-only
```

### 6. Sample input

Builds `settings/sample-input.json` from `ml-base/artifacts/features/test.npz` row 0:

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/gen_input.py
ml-base/.venv/bin/python circuits-baseline/scripts/gen_input.py --sample-index 3
```

Input format:

```json
{"input_data": [[f0, f1, f2, f3, f4, f5]]}
```

### 7. Witness

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/gen_witness.py
```

### 8. Prove

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/prove.py
```

Typical local time: tens of seconds on CPU (circuit-dependent).

### 9. Verify (off-chain)

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/verify.py
```

Exit code 0 = PASS.

### 10. EVM verifier

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/gen_evm_verifier.py
```

Outputs `verifiers/RiskScoreVerifier.sol` and `.abi`.

## Local demo

Full flow with manifest + oracle payload:

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/demo.py
```

Fast rerun (reuse compiled circuit + keys):

```bash
ml-base/.venv/bin/python circuits-baseline/scripts/demo.py --skip-setup --skip-compile --sample-index 0
```

Writes:

- `logs/demo-latest.json` — features, score, verify result
- `proofs/oracle-payload.json` — fields for `RiskOracle` integration

## Oracle submission interface

`proofs/oracle-payload.json` maps proof artifacts to the contract interface:

| Field | Description |
|-------|-------------|
| `epoch` | Demo epoch (`2026041`) |
| `modelHash` / `adapterHash` | Committed model identity (hex) |
| `scoreBps` | Risk score in basis points (0–10000) |
| `scoreFloat` | Rescaled witness output (~[0,1]) |
| `proofHex` | Serialized proof for verifier |
| `publicInputs` | 7 public field elements (6 inputs + 1 output) |

Wire this to `RiskOracle.submitScore` in Phase 2 after deploying the generated verifier (replace `StubRiskScoreVerifier`).

Python API:

```python
from zyocra_ezkl.oracle_payload import build_oracle_payload, write_oracle_payload
```

## Known flaky / manual pitfalls

| Issue | Why | Fix |
|-------|-----|-----|
| `gen_settings` fails on ONNX | External `.onnx.data` sidecar | Run `prepare_onnx.py` or re-export with `export_onnx.py` (inlines weights) |
| Dynamic batch `[0, 6]` | EZKL needs fixed shape | Export with `--static-batch` (default in ml pipeline) |
| `ezkl.get_srs()` | Requires asyncio event loop in 23.0.5 | Use `gen_srs()` via `setup.py` |
| `create_evm_verifier` hangs | Returns a Future in 23.0.5 | Wrapped with `asyncio.run()` in `gen_evm_verifier.py` |
| Version mismatch | Different ezkl wheel | `pip install ezkl==23.0.5` in ml-base venv |
| Large `pk.key` | Full MLP in-circuit | Normal; keys are cached under `keys/` for reruns |
| Scale warning | `input_scale=7` | Documented tradeoff for Q8.8; increase scale if precision issues appear |

## Reruns

| Goal | Command |
|------|---------|
| New proof, same circuit | `demo.py --skip-setup --skip-compile` |
| Recompile after ONNX change | `run_pipeline.sh` or omit `--skip-compile` |
| Fresh keys | Delete `keys/` and run `setup.py` |

## Proof statement

For the committed ONNX graph (`zyocra-risk-mlp-v1`) and public input features, the published risk score in the proof is the exact fixed-point result of executing that graph under EZKL scales (`input_scale=7`, `param_scale=7`).
