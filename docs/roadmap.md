# Roadmap

Milestone-driven delivery. Prefer a complete milestone before starting the next. Local-first on Ubuntu WSL; no paid infra in the default path.

## Milestone 1 — ML and quantization

**Package:** `ml-base/`

- Build the small tabular risk model (`training/`)
- Add LoRA adapters as \(W' = W + AB\) (`lora/`)
- Export ONNX graph (`onnx-export/`)
- Float vs fixed-point evaluation (`quantization/`)

**Exit criteria:** reproducible train/export scripts; documented quantization error metrics; small fixtures committed where safe.

## Milestone 2 — EZKL baseline

**Package:** `circuits-baseline/` + `contracts/` (verifier)

- Generate setup and proof artifacts
- Produce the EZKL-generated Solidity verifier
- Verify a risk score on-chain (local Anvil)

**Exit criteria:** end-to-end prove → verify for one epoch sample; Foundry tests for accept/reject.

## Milestone 3 — Custom circuit

**Package:** `circuits-custom/`

- Circom low-rank update gadget (\(W + AB\))
- Dense-layer subgraph
- Activation approximation if needed
- Proof + Solidity verifier via Foundry

**Exit criteria:** proof for the selected subgraph; verifier tests; artifacts comparable to baseline workload.

## Milestone 4 — Consumer integration

**Package:** `contracts/`

- Risk-bucket consumer contract
- Wire verified oracle submissions to collateral-parameter updates
- Buckets: low / medium / high / critical (no instant liquidation)

**Exit criteria:** Foundry tests for parameter updates only after verified oracle output.

## Milestone 5 — Benchmark and publish

**Package:** `benchmarks/` + `docs/` + root `README.md`

- Apples-to-apples metrics (constraints, RAM, prove time, verify gas, proof size, accuracy loss, complexity notes)
- Raw results and plots under `benchmarks/raw-results/` and `benchmarks/plots/`
- Technical report (`docs/technical-report.md`)
- README headline benchmark table
- Optional end-to-end demo script (off-chain inference → on-chain parameter update)

**Exit criteria:** reproducible `make benchmark` (or package scripts) on a documented machine profile; recruiter-readable findings.

## Optional — Demo UI

Dispatch-inspired product shell (yellow accents, not orange) for visualizing scores, proofs, and consumer state. Does **not** block milestones 1–5.

## Current status

| Milestone | Status |
|-----------|--------|
| Repo layout, docs, local toolchain | Done |
| Milestone 1 (ML + quantization) | Not started |
| Milestone 2 (EZKL baseline) | Not started |
| Milestone 3 (Custom Circom) | Done — `lora_output_head` (44 nonlinear constraints), Groth16 pipeline, `docs/circom.md` |
| Milestone 4 (Consumer) | Not started |
| Milestone 5 (Benchmarks + publish) | Env snapshot only |

## Resume-oriented outcome

Built a verifiable zkML DeFi risk oracle that proved LoRA-adapted model inference off-chain and verified outputs on-chain in Solidity; benchmarked EZKL-generated circuits against a hand-optimized Circom implementation across proof time, constraint count, RAM, gas cost, and quantization accuracy.
