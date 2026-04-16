# Architecture

## Overview

```text
Features (tabular) ──► ml-base (train, LoRA, quantize, ONNX)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   circuits-baseline (EZKL)        circuits-custom (Circom)
   full ONNX graph prove           LoRA + dense subgraph prove
              │                               │
              └───────────────┬───────────────┘
                              ▼
                    contracts (Foundry)
                    Oracle verifier + mock lending consumer
                              │
                              ▼
                    benchmarks (apples-to-apples metrics)
```

Epoch- or daily-scale risk scores fit current prove latency and on-chain verification patterns better than per-block trading decisions.

## 1. Machine learning layer (`ml-base/`)

### Model

Compact **tabular** model (small MLP or logistic-style), not transformer-first. Easier to quantize; aligns with circuit-level cost analysis of linear algebra and activations.

### Example features

- Collateralization ratio
- Debt utilization ratio
- Historical volatility proxy
- Recent liquidation proximity
- Borrow concentration metrics
- Wallet behavior summary statistics

Feature pipeline must be **deterministic and reproducible** so ONNX graphs, quantization artifacts, and benchmarks replay end-to-end.

### LoRA

Treat LoRA as a structured weight update:

\[
W' = W + AB
\]

where \(W\) is the base weight matrix, \(A\) and \(B\) are low-rank adapters, and \(W'\) is the effective adapted matrix. This framing is shared by the custom circuit and the benchmark narrative.

### Quantization

First-class axis, not an implementation footnote:

- Float32 baseline inference
- Fixed-point export pipeline
- Scale-factor selection and overflow bounds
- Error analysis: float vs field-compatible arithmetic

Precision loss and circuit size are tightly coupled in zkML systems.

## 2. Baseline path (`circuits-baseline/`)

**Toolchain:** PyTorch → ONNX → EZKL → generated EVM verifier (Foundry deploy/test).

**Proof statement:** for a committed model graph and declared public/semi-public inputs, the published risk score is the exact result of executing the exported ONNX model under the chosen quantization configuration.

Demonstrates full-stack ability: training/export through on-chain verification with contemporary zkML tooling.

## 3. Custom path (`circuits-custom/`)

Does **not** replace all of EZKL. Targets the subgraph where low-rank structure is most optimizable:

- LoRA delta \(W' = W + AB\)
- Dense-layer dot products with \(W'\)
- Optional activation approximation (Horner / piecewise-linear)

**DSL:** Circom (explicit R1CS-style arithmetic, portable across zk infra teams).

**Proof statement:** for public \(x\), commitments \(h_W\), \(h_A\), \(h_B\), and public \(y\):

\[
y = f((W + AB)x + b)
\]

under declared quantization and activation approximation rules.

## 4. Smart contracts (`contracts/`)

### Oracle

Stores model hash, adapter hash, epoch/timestamp, verified risk score, proof metadata. Rejects submissions that fail verification against the expected verifier and public inputs.

### Consumer

Mock lending-risk module. Updates **collateral parameters** from verified risk buckets (low / medium / high / critical). Not a liquidation bot.

### Stack

Solidity, Foundry, tests for verifier accept/reject and consumer updates after verified oracle submissions. Local Anvil only by default.

## 5. Benchmarking (`benchmarks/`)

Central research artifact. Compare EZKL and Circom on the **same logical workload** where possible.

| Metric | Both paths |
|--------|------------|
| Constraint count | From circuit artifacts |
| Prover peak RAM | During proof generation |
| Proof generation time | End-to-end |
| Verification gas | EVM verifier call |
| Proof size | Bytes |
| Numerical accuracy loss | Float vs fixed-point |
| Engineering complexity | Setup/maintenance notes |

**Methodology must fix:** machine specs, input batch, model family, quantization level, public I/O policy, gas harness.

## Package map

| Path | Role |
|------|------|
| `ml-base/` | Training, quantization, LoRA, ONNX export |
| `circuits-baseline/` | EZKL pipeline, settings, proofs |
| `circuits-custom/` | Circom sources, inputs, witnesses, proofs |
| `contracts/` | Oracle + mock lending consumer |
| `benchmarks/` | Scripts, raw-results, plots |
| `docs/` | Architecture, threat model, roadmap, setup |
| `scripts/` | Root install/dev/test/lint/benchmark entrypoints |
| `ci/` | Optional local CI definitions (later) |

## Status

Layout and documentation are in place. Application code lands per `docs/roadmap.md` milestones. No paid infra in the default path.
