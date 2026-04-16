# Zyocra

**A benchmark-driven zkML oracle for DeFi that compares compiler-generated and hand-optimized zero-knowledge circuits for LoRA-adapted risk inference, with on-chain verification and dynamic collateral-parameter updates in a mock lending protocol.**

Technical framing: **Verifiable LoRA Risk Oracle**.

## Problem statement

DeFi lending systems adjust collateralization and borrowing conditions using risk signals. zkML frameworks such as EZKL make verifiable inference practical, but compiler-generated circuits can hide inefficiencies in structured algebra—especially LoRA updates of the form \(W' = W + AB\).

Zyocra implements the **same logical workload** on two paths and measures the difference:

| Path | Pipeline |
|------|----------|
| **Baseline** | PyTorch → ONNX → EZKL → generated EVM verifier |
| **Custom** | Hand-optimized Circom (LoRA delta + dense subgraph) → Solidity verifier |

The consumer is a **mock lending-risk module** that updates collateral parameters by verified risk bucket—not a liquidation bot.

## Benchmark headline

*Filled in Milestone 5. Methodology is fixed in `docs/architecture.md` and `benchmarks/README.md`.*

| Metric | EZKL baseline | Custom Circom |
|--------|---------------|---------------|
| Constraint count | — | — |
| Prover peak RAM | — | — |
| Proof generation time | — | — |
| Verification gas | — | — |
| Proof size | — | — |
| Float vs fixed-point error | — | — |
| Engineering complexity | — | — |

```bash
make benchmark   # writes env snapshots to benchmarks/raw-results/ today
```

## System architecture

```text
ml-base/                 train, LoRA (W'=W+AB), quantize, ONNX export
        │
        ├─► circuits-baseline/   EZKL full-graph prove + verifier
        │
        └─► circuits-custom/     Circom LoRA + dense subgraph prove + verifier
                    │
                    ▼
              contracts/         oracle + mock lending consumer (Foundry)
                    │
                    ▼
              benchmarks/        apples-to-apples metrics, plots, methodology
```

Details: [`docs/architecture.md`](docs/architecture.md).

## End-to-end demo flow (target)

1. Off-chain: run quantized, LoRA-adapted risk inference for an epoch.
2. Prove via EZKL baseline and/or Circom custom path.
3. Submit proof + public inputs to the oracle contract.
4. On valid verification, consumer updates borrower risk bucket and collateral parameters.
5. Record prove time, gas, proof size, and accuracy into `benchmarks/raw-results/`.

## Repository layout

```text
Zyocra/
├── ml-base/                 # training, quantization, lora, onnx-export
├── circuits-baseline/       # ezkl, settings, proofs
├── circuits-custom/         # circom, inputs, witnesses, proofs
├── contracts/               # src, script, test (Foundry)
├── benchmarks/              # scripts, raw-results, plots
├── docs/                    # product, architecture, threat model, roadmap, setup
├── scripts/                 # install, dev, test, lint, benchmark
├── ci/                      # optional CI (later)
├── Makefile
└── README.md
```

## Status

| Area | Status |
|------|--------|
| Monorepo layout + docs | Done |
| Local toolchain (`make install`) | Done |
| Milestone 1 — ML + quantization | Not started |
| Milestone 2 — EZKL baseline | Not started |
| Milestone 3 — Custom Circom | Not started |
| Milestone 4 — Consumer integration | Not started |
| Milestone 5 — Benchmarks + report | Env snapshot only |

Roadmap: [`docs/roadmap.md`](docs/roadmap.md).

## Threat model (summary)

**Guarantees:** score matches declared model/weights under the proof system; oracle accepts only valid proofs; consumer updates only from verified oracle output.

**Non-guarantees:** model optimality, dataset bias, market-level manipulation resistance, honest off-chain data feeds.

Full write-up: [`docs/threat-model.md`](docs/threat-model.md).

## Local-first / no paid infra

Default workflow is **free and local** on Ubuntu WSL:

- Python venv + PyTorch **CPU** + ONNX + EZKL (Python API)
- Circom (custom path)
- Foundry + Anvil (no paid RPC)
- No Docker required for current milestones
- No cloud provers or hosted services unless you explicitly add them

Large artifacts and personal notes stay out of git (see `.gitignore`; local-only parent dir `~/projects/zyocra/`).

## Quick start

```bash
# prerequisites: node, pnpm, python3, rustc, foundry (see docs/setup.md)
make install
source ml-base/.venv/bin/activate

make check-tools
make test
make lint
make benchmark
```

Full install and run commands: [`docs/setup.md`](docs/setup.md).

## Documentation

| Doc | Contents |
|-----|----------|
| [`docs/product.md`](docs/product.md) | Positioning, goals, non-goals |
| [`docs/architecture.md`](docs/architecture.md) | Layers, proof statements, package map |
| [`docs/threat-model.md`](docs/threat-model.md) | Guarantees and non-guarantees |
| [`docs/roadmap.md`](docs/roadmap.md) | Milestones 1–5 |
| [`docs/setup.md`](docs/setup.md) | Ubuntu WSL toolchain |
| [`docs/ui-reference.md`](docs/ui-reference.md) | Optional Dispatch-inspired UI (yellow accents) |
| [`docs/technical-report.md`](docs/technical-report.md) | Milestone 5 report placeholder |

## License

MIT — see [`LICENSE`](LICENSE).
