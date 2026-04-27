# circuits-baseline

EZKL baseline proving path: ONNX → circuit compilation → witness → proof → EVM verifier.

Pinned toolchain: **ezkl==23.0.5** (installed via `ml-base/.venv`).

## Layout

| Path | Purpose |
|------|---------|
| `zyocra_ezkl/` | Python package: config, pipeline steps, oracle payload builder |
| `scripts/` | One script per pipeline stage + `demo.py` + `run_pipeline.sh` |
| `onnx/` | EZKL-ready ONNX copy (weights inlined) |
| `settings/` | `settings.json`, compiled `network.ezkl`, sample input |
| `keys/` | SRS, vk, pk (large — gitignored) |
| `witnesses/` | Witness JSON |
| `proofs/` | Proof JSON + oracle submission payload |
| `verifiers/` | Generated `RiskScoreVerifier.sol` + ABI |
| `logs/` | Demo run manifest |

## Quick start

From repo root (requires `ml-base` pipeline artifacts):

```bash
# One-shot (prepare → prove → verify → EVM verifier)
bash circuits-baseline/scripts/run_pipeline.sh

# Or rerun only the demo (reuse keys + compiled circuit)
ml-base/.venv/bin/python circuits-baseline/scripts/demo.py --skip-setup --skip-compile
```

Full command reference: [docs/ezkl.md](../docs/ezkl.md).

## Oracle interface (Phase 2)

After `demo.py`, see `proofs/oracle-payload.json` for `RiskOracle.submitScore`-compatible fields (`epoch`, `modelHash`, `adapterHash`, `scoreBps`, `proofHex`, `publicInputs`).
