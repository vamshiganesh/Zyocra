# Benchmarks

Rigorous, reproducible comparison of the **EZKL baseline** (`circuits-baseline/`) and **Circom custom path** (`circuits-custom/`).

## Quick start

```bash
make benchmark
```

Outputs land in `benchmarks/raw-results/bench-latest.{json,csv,md}` and `benchmarks/plots/*.svg`.

### Prerequisites

- `ml-base/.venv` with `ezkl==23.0.5` (`make install`)
- EZKL pipeline artifacts (`circuits-baseline/scripts/run_pipeline.sh`)
- Circom + `circuits-custom/npm install` (snarkjs)
- `circom` compiler on `PATH`
- Linux `/usr/bin/time` recommended for peak RSS

### Options

```bash
bash benchmarks/scripts/run.sh --refresh-prove   # re-prove before timing
bash benchmarks/scripts/run.sh --skip-gas          # skip Foundry gas tests
```

## Metrics

| Metric | EZKL source | Circom source |
|--------|-------------|---------------|
| Constraint count | `settings.json` → `num_rows` | `snarkjs r1cs info` |
| Prove time (median ms) | `prove.py` × 3 runs | `prove.sh` × 3 runs |
| Verify time (ms) | `ezkl.verify()` | `snarkjs groth16 verify` |
| Proof size (bytes) | `proofs/proof.json` | `proofs/proof.json` |
| Peak RSS (KB) | `/usr/bin/time -v` on prove | same |
| Verify gas | `BenchmarkGasTest` EZKL | `BenchmarkGasTest` Circom |
| Accuracy | ml-base validation (full model) | head fixture integer recompute |

## Normalized JSON schema

`bench-latest.json` top-level fields:

- `schema_version` — `"1.0"`
- `kind` — `"zyocra_benchmark"`
- `environment` — host, CPU count, tool versions
- `methodology` — sample index, prove runs, measurement policy
- `workloads.ezkl` / `workloads.circom` — per-path raw measurements
- `gas` — EVM verifier gas from Foundry
- `accuracy` — quantization error where defined
- `metrics` — flat table (also exported as CSV)
- `limitations` — explicit non-comparability notes

## Methodology

### Hardware

Recorded automatically in each run:

- `platform` (from `platform.platform()`)
- `cpu_count`
- `mem_total_kb` (Linux `/proc/meminfo`)
- `hostname`

**Fix one machine profile** when publishing results — copy `bench-latest.json` → `docs/technical-report.md` or a pinned `env.txt` in commit messages.

### Software versions

Pinned in `environment.tools` and `environment.python_packages`:

- EZKL `23.0.5` (Python API)
- Circom `2.2.x`
- Foundry `forge`
- snarkjs (from `circuits-custom/package.json`)

### Assumptions

- **Sample size:** one borrower vector (`sample_index=0`, epoch `2026-041`); prove timing uses **3 runs** (median).
- **Quantization:** Q8.8 — `activation_scale=128`, `weight_scale=256` (matches `ml-base`).
- **Public I/O:** EZKL uses settings visibility; Circom exposes `hidden[8]` + `logit_acc` publicly.
- **Gas:** standalone `verify()` on deployed verifiers — not full `RiskOracle.submitScore` calldata.
- **RAM:** peak resident set during prove subprocess only.

### Workload scope (critical)

| Path | What is measured |
|------|------------------|
| EZKL | Full ONNX graph inference proof |
| Circom | LoRA output-head subgraph only (`lora_output_head.circom`) |

Constraint count and prove time **are not end-to-end equivalent**. The research question is whether the structured subgraph is cheaper than embedding the same algebra inside a compiler-generated full graph.

## Limitations

1. Different proof systems: EZKL Halo2/KZG vs Circom Groth16 — verify gas and proof size are not directly comparable across curves/PCSs.
2. EZKL `num_rows` ≠ Circom R1CS constraint count — different definitions; table includes notes per metric.
3. Accuracy: EZKL reports full-model float vs fixed-point error on the test split; Circom reports integer recompute on a single head fixture — **not the same score endpoint**.
4. Local Circom `pot12` ceremony is for development benchmarks only.
5. Peak RSS unavailable without `/usr/bin/time` (non-Linux hosts).
6. No confidence intervals — medians of 3 runs on one machine.
7. Oracle integration gas (storage, events) excluded.

## Architecture

```
benchmarks/scripts/run.sh
        │
        ▼
zyocra_bench/runner.py
        ├── env.py           # host + versions
        ├── ezkl_bench.py    # EZKL metrics
        ├── circom_bench.py  # Circom metrics + gas-input.json
        ├── gas_bench.py     # forge test BenchmarkGasTest
        ├── accuracy.py      # ml-base + fixture checks
        ├── schema.py        # normalized report + limitations
        └── report.py        # JSON, CSV, MD, SVG
```

Gas probes: `contracts/test/BenchmarkGas.t.sol` logs `EZKL_VERIFY_GAS` and `CIRCOM_VERIFY_GAS` to stdout.

## Tests

```bash
export PYTHONPATH=benchmarks
ml-base/.venv/bin/python -m pytest benchmarks/tests/ -q
```

Root `make test` runs benchmark unit tests when present.

## Related docs

- [`docs/circom.md`](circom.md) — custom circuit scope
- [`docs/ezkl.md`](ezkl.md) — baseline pipeline
- [`docs/architecture.md`](architecture.md) — system context
