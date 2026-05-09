# Circom custom path (`circuits-custom/`)

Hand-optimized Groth16 circuit for the **LoRA output head** — the algebraic core of the Zyocra risk MLP where low-rank structure is most optimizable.

This path does **not** replace the full EZKL ONNX graph. It proves one benchmarkable subgraph that EZKL must embed inside a much larger compiled circuit.

## Why this workload

| Factor | Rationale |
|--------|-----------|
| **Model alignment** | Phase 1 applies LoRA only on the output head (`8 → 1`, rank `4`) after a shared backbone. |
| **Algebraic structure** | Effective weights are \(W' = W + AB\). A hand circuit can fuse \(\sum_r A[r]\cdot\langle B[r,:], h\rangle\) without materializing \(AB\). |
| **Benchmark fairness** | Same Q8.8 integer grids as `ml-base` (`activation_scale=128`, `weight_scale=256`). Bias and sigmoid stay out-of-circuit on both paths (documented approximation). |
| **Constraint transparency** | ~44 non-linear constraints vs compiler output on the full MLP — the comparison target for Milestone 5. |

## Proof statement

For public hidden activation vector \(h \in \mathbb{Z}^{8}\) (backbone output, Q8.8) the circuit proves knowledge of private

- base weight \(W \in \mathbb{Z}^{8}\)
- LoRA factors \(A \in \mathbb{Z}^{4}\), \(B \in \mathbb{Z}^{4 \times 8}\)

such that the public output `logit_acc` equals:

\[
\text{logit\_acc} = \langle h, W\rangle + \sum_{r=0}^{3} A[r]\cdot\langle B[r,:], h\rangle
\]

with integer arithmetic clipped to the ml-base accumulator width (32-bit).

**Out of scope (by design):** backbone layers, bias addition, sigmoid, oracle metadata. Those are either shared precomputation or handled like the EZKL baseline boundary.

## Layout

```
circuits-custom/
├── circom/
│   ├── lora_output_head.circom    # main circuit
│   └── gates/
│       ├── dot_product.circom
│       ├── lora_rank_dot.circom   # fused low-rank dot (no AB materialization)
│       └── sum.circom
├── zyocra_circom/                 # Python: fixed-point ref + witness export
├── scripts/                       # compile, prove, verify, export verifier
├── fixtures/head-v1.json          # committed deterministic witness vector
├── build/                         # r1cs, wasm (generated)
├── keys/                          # ptau, zkey (generated; pot12 committed locally)
├── inputs/                        # input.json for witness calculator
├── witnesses/                     # witness.wtns
├── proofs/                        # proof.json, public.json
└── verifiers/LoraHeadVerifier.sol # Groth16 Solidity verifier (generated)
```

## Quick start

Prerequisites: `circom` 2.x, Node.js, `snarkjs` (installed via `npm install` in this directory), `ml-base` venv.

```bash
# From repo root
cd circuits-custom
npm install
bash scripts/run_pipeline.sh
```

Individual steps:

```bash
bash scripts/export_fixture.sh   # fixtures/ + inputs/input.json
bash scripts/compile.sh            # build/lora_output_head.{r1cs,wasm}
bash scripts/setup_ptau.sh         # keys/pot12_final.ptau (local ceremony)
bash scripts/setup_keys.sh         # keys/circuit_final.zkey
bash scripts/gen_witness.sh
bash scripts/prove.sh
bash scripts/verify.sh             # prints "OK!"
bash scripts/export_verifier.sh    # verifiers/LoraHeadVerifier.sol
```

When `ml-base/artifacts/models/checkpoint.pt` exists, `export_fixture.sh` exports **unfolded** LoRA weights and a real backbone hidden vector from `test.npz`. Otherwise it uses the committed `fixtures/head-v1.json` synthetic grid.

## Public vs private I/O

| Signal | Visibility | Role |
|--------|------------|------|
| `hidden[8]` | public input | Backbone output (Q8.8) |
| `logit_acc` | public output | Integer dot-product accumulator |
| `weight_base[8]` | private | Base head weight \(W\) |
| `lora_a[4]`, `lora_b[32]` | private | LoRA factors (rank 4, row-major \(B\)) |

`proofs/public.json` ordering: `[hidden[0..7], logit_acc]`.

## Circuit size (reference)

Compiled with circom 2.2.3:

| Metric | Value |
|--------|------:|
| Non-linear constraints | 44 |
| Linear constraints | 45 |
| Public inputs | 8 |
| Private inputs | 44 |
| Public outputs | 1 |

Re-check after template changes:

```bash
npx snarkjs r1cs info build/lora_output_head.r1cs
```

## Tests

```bash
# Python reference math
export PYTHONPATH=circuits-custom
ml-base/.venv/bin/python -m pytest circuits-custom/tests/test_fixed_point.py -q

# Compile + witness (fast)
bash circuits-custom/tests/test_circuit.sh

# Full prove + verify (slower, ~1 min first run for ptau)
bash circuits-custom/tests/test_prove_verify.sh
```

Root `make test` runs the Python tests when `circuits-custom/tests` is present.

## Relation to EZKL baseline

| | EZKL (`circuits-baseline/`) | Circom (`circuits-custom/`) |
|--|-----------------------------|-----------------------------|
| Scope | Full ONNX graph (6 → 16 → 8 → 1 + activations) | Output head LoRA dot only |
| LoRA | Folded into effective weights at export | Explicit \(A,B\) + fused rank dot |
| Verifier | Halo2 / KZG (`Halo2Verifier.sol`) | Groth16 (`LoraHeadVerifier.sol`) |
| Goal | End-to-end oracle demo | Constraint / prover economics benchmark |

Milestone 5 compares both on constraints, RAM, prove time, verify gas, proof size, and quantization error.

## Solidity verifier

`scripts/export_verifier.sh` writes `verifiers/LoraHeadVerifier.sol`. Integration with `RiskOracle` (via a thin `IRiskScoreVerifier` adapter) is a follow-up — the verifier is exported and ready for Foundry import.

## Further work

- Optional in-circuit bias with fixed-point rescale
- Piecewise-linear sigmoid gadget (if benchmark scope expands)
- `CircomRiskScoreVerifier` adapter + Anvil deploy script
- Populate `benchmarks/raw-results/circom-*.json` in Milestone 5
