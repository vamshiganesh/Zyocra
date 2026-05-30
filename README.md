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

*From `make benchmark` on WSL2 — see [`docs/benchmarks.md`](docs/benchmarks.md) for methodology and limitations.*

| Metric | EZKL baseline | Custom Circom |
|--------|---------------|---------------|
| Constraint count | 964 (PLONK rows) | 89 (R1CS) |
| Prover peak RAM | ~1.7 GB | ~185 MB |
| Proof generation time | ~23 s (median) | ~1.9 s (median) |
| Verification gas (EVM) | 536,109 | 244,502 |
| Proof size | ~21 KB | ~804 B |
| Float vs fixed-point error | 0.0064 max abs (test split) | head fixture integer exact |
| Engineering complexity | ONNX → EZKL full pipeline | hand-written LoRA head subgraph |

```bash
make benchmark   # writes bench-latest.{json,csv,md} + plots/
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
| UI shell + design system | Done (live data binding) |
| Milestone 1 — ML + quantization | Done (`ml-base/`, ONNX export, Q8.8 validation) |
| Milestone 2 — EZKL baseline | Done (`circuits-baseline/`, Halo2 verifier, e2e) |
| Milestone 3 — Custom Circom | Done (`lora_output_head`, Groth16 pipeline) |
| Milestone 4 — Consumer integration | Done (`RiskOracle` + `RiskConsumer`, Foundry tests) |
| Milestone 5 — Benchmarks + report | Done (`make benchmark`, `docs/technical-report.md`) |
| CI (GitHub Actions) | Done (`.github/workflows/ci.yml`) |
| Oracle hardening (score binding + prover ACL) | Done |
| Demo UI + data binding | Done (live `phase1-demo.json`, `bench-latest.json`) |

Roadmap: [`docs/roadmap.md`](docs/roadmap.md).

## Trust model (summary)

Zyocra separates **proof correctness** from **model quality** and **data honesty**.

| Layer | What is trusted |
|-------|-----------------|
| **Proof** | Declared inference ran as specified (EZKL: full graph; Circom: LoRA head subgraph only). |
| **Oracle** | Verifier soundness, deploy-time `modelHash`/`adapterHash`, monotonic epochs, valid `(proof, publicInputs)`. |
| **Consumer** | Verified oracle scores; hard-coded bucket → collateral policy. |

**Not attested:** feature feed honesty, borrower identity in proofs, economic optimality of the model, market manipulation resistance, benchmark cross-path equivalence (EZKL full graph vs Circom head).

**Known Phase 1 gaps:** `applyVerifiedScore(borrower, …)` does not bind the borrower to proof inputs; `setVerifier` is owner-controlled without timelock; Circom path is not wired to `RiskOracle.submitScore` (adapter deployed standalone).

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
make test          # Foundry + pytest (ml-base, circuits-custom, benchmarks) + frontend tsc
make lint
make benchmark     # EZKL vs Circom metrics → benchmarks/raw-results/

# Operator dashboard (FastAPI + frontend)
cp .env.example .env   # edit RPC_URL / keys as needed
make operator          # API on :8787
make dev               # operator + Vite frontend
```

Open **Operator** in the UI (`/operator`) to run `e2e_phase1.sh`, deploy, submit, and benchmark jobs with streaming logs.

### Testnet (Ethereum Sepolia)

```bash
cp .env.example .env
# Set SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY

bash scripts/deploy_testnet.sh          # prove + deploy + verify
# Or skip reprove: SKIP_PROVE=1 bash scripts/deploy_testnet.sh
```

After deploy, copy addresses from `contracts/deployments/sepolia-ezkl-latest.json` into `.env`:

- `VITE_ORACLE_ADDRESS`, `VITE_CONSUMER_ADDRESS`, `VITE_RPC_URL`

| Contract | Address (fill after deploy) |
|----------|----------------------------|
| RiskOracle | _see sepolia-ezkl-latest.json_ |
| RiskConsumer | _see sepolia-ezkl-latest.json_ |
| EzklRiskScoreVerifier | _see sepolia-ezkl-latest.json_ |
| Halo2Verifier | _see sepolia-ezkl-latest.json_ |

### Test commands

| Command | What runs |
|---------|-----------|
| `make test` | All suites: `forge test`, `ml-base` pytest, `circuits-custom` (if circom installed), `benchmarks` pytest, `frontend` `tsc` |
| `cd contracts && forge test` | Solidity only |
| `cd ml-base && pytest -q` | ML pipeline unit tests |
| `bash circuits-custom/tests/test_prove_verify.sh` | Full Circom Groth16 loop |
| `make operator` | FastAPI operator service (`:8787`) |
| `make dev` | Operator + frontend dev servers |
| `bash scripts/e2e_phase1.sh` | EZKL → Anvil → oracle → consumer |
| `cd frontend && pnpm test` | TypeScript typecheck |

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
| [`docs/benchmarks.md`](docs/benchmarks.md) | EZKL vs Circom harness and limitations |

## License

MIT — see [`LICENSE`](LICENSE).

## Changelog

### v0.4.0

- **Security:** `RiskOracle` binds `scoreBps` to EZKL public output limb; `authorizedProvers` ACL on `submitScore`.
- **Benchmarks:** normalized metrics, prove stdev, hybrid cost model, head alignment, optional EZKL head-only row (`make head-benchmark`).
- **Contracts:** `CircomRiskScoreVerifier`, `CircomProofJsonLib`, `DeployCircom.s.sol`.
- **CI:** GitHub Actions (Foundry, pytest, frontend tsc).
- **Docs:** filled `docs/technical-report.md`.

### v0.3.0

- Frontend live data binding, benchmark harness, threat model polish.
