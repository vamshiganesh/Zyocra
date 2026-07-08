# Zyocra

**A benchmark-driven zkML oracle for DeFi that compares compiler-generated and hand-optimized zero-knowledge circuits for LoRA-adapted risk inference, with on-chain verification and dynamic collateral-parameter updates in a mock lending protocol.**

Technical framing: **Verifiable LoRA Risk Oracle**.

## Problem statement

DeFi lending systems adjust collateralization and borrowing conditions using risk signals. zkML frameworks such as EZKL make verifiable inference practical, but compiler-generated circuits can hide inefficiencies in structured algebra—especially LoRA updates of the form \(W' = W + AB\).

Zyocra implements the **same risk model** on two proving paths — **matched on the LoRA output head**, **asymmetric on full inference by design**:

| Path | Pipeline | Role |
|------|----------|------|
| **EZKL full** | PyTorch → ONNX → EZKL → Halo2 verifier | End-to-end score attestation (oracle e2e) |
| **EZKL head** | Head-only ONNX → EZKL | Fair bakeoff against Circom (`make head-benchmark`) |
| **Circom head** | Hand Circom LoRA head → Groth16 | Structure-aware adapter proofs |

The consumer is a **mock lending-risk module** that updates collateral parameters by verified risk bucket—not a liquidation bot.

## Benchmark headline

*Primary claim = matched head. Full-graph row is a separate system workload — see [`docs/benchmarks.md`](docs/benchmarks.md).*

### Primary — fair circuit comparison (matched LoRA head)

| Metric | EZKL head | Circom head |
|--------|-----------|-------------|
| Constraint count | 106 (PLONK rows) | 89 (R1CS) |
| Prover peak RAM | ~1.4 GB | ~185 MB |
| Proof generation time | ~15.8 s (median) | ~2.0 s (median) |
| Proof size | ~19 KB | ~806 B |

```bash
make head-benchmark   # includes ezkl_head + syncs frontend when you run sync-frontend-data.sh
```

### Secondary — system workloads (not equivalent)

| Metric | EZKL full graph | Circom head |
|--------|-----------------|-------------|
| Constraint count | 964 (PLONK rows) | 89 (R1CS) |
| Prover peak RAM | ~1.7 GB | ~185 MB |
| Proof generation time | ~23 s (median) | ~2.0 s (median) |
| Verification gas (EVM) | 536,109 | 244,502 |
| Proof size | ~21 KB | ~806 B |

**Do not** read the secondary table as a kernel bakeoff. Full-graph EZKL proves features→score; Circom proves head-only `logit_acc`.

### Hybrid amortized cost

One EZKL full prove per epoch + Circom head proves per adapter update (default 4): see `workloads.hybrid` in `bench-latest.json` (~6.6 s amortized prove / update on the latest local run).

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

**Known Phase 1 gaps:** EZKL borrower binding still uses an appended public-input limb (Circom borrower is in-circuit); Circom score uses cubic Taylor sigmoid over dequantized `logit_acc` (not in-circuit); `setVerifier` is owner-controlled without timelock.

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

Open **Operator** in the UI (`/operator`) to run `e2e_phase1.sh` or `e2e_circom.sh`, deploy, submit, and benchmark jobs with streaming logs.

### Testnet (Ethereum Sepolia)

**Split:** Operator defaults to **local Anvil**. Toggle **Operator → Sepolia** in the UI (or `POST /api/chain/mode`) to broadcast forge deploy/submit with `SEPOLIA_RPC_URL` + `DEPLOYER_PRIVATE_KEY`. Full epoch stays Anvil-only. Use **Wallet submit (Sepolia)** so MetaMask signs `submitScore` + `applyVerifiedScore` (wallet must be `authorizedProver`, usually the deployer).

```bash
cp .env.example .env
# Set SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ETHERSCAN_API_KEY

bash scripts/deploy_testnet.sh          # prove + deploy + verify (once)
# Or skip reprove: SKIP_PROVE=1 bash scripts/deploy_testnet.sh

bash scripts/submit_testnet.sh          # one-shot submitScore + applyVerifiedScore
# Or reuse proof: SKIP_PROVE=1 bash scripts/submit_testnet.sh

# Circom stack (separate oracle / commitments from EZKL):
SKIP_PROVE=1 bash scripts/deploy_circom_testnet.sh
SKIP_PROVE=1 bash scripts/submit_circom_testnet.sh
```

Point the frontend at Sepolia (restart `make dev` after editing `.env`):

- `VITE_ORACLE_ADDRESS`, `VITE_CONSUMER_ADDRESS`, `VITE_RPC_URL`
- Circom and EZKL use **different** oracle addresses — set `VITE_*` to the stack you want to read.

#### Current Sepolia EZKL deployment

| Contract | Address |
|----------|---------|
| RiskOracle | [`0x623D3de19A2Ce108131F2c03433ACdBf4eca2252`](https://sepolia.etherscan.io/address/0x623D3de19A2Ce108131F2c03433ACdBf4eca2252) |
| RiskConsumer | [`0x8a0b538D2e46DD9E03d453164F00a57531EE3C6D`](https://sepolia.etherscan.io/address/0x8a0b538D2e46DD9E03d453164F00a57531EE3C6D) |
| EzklRiskScoreVerifier | [`0x16a1b555FEE645Efce99169b198A84f2d29E088D`](https://sepolia.etherscan.io/address/0x16a1b555FEE645Efce99169b198A84f2d29E088D) |
| Halo2Verifier | [`0x6Dd062079edc8817732483119bAe2374F92D1c51`](https://sepolia.etherscan.io/address/0x6Dd062079edc8817732483119bAe2374F92D1c51) |

Latest loop (`contracts/deployments/sepolia-loop-latest.json`): **epoch `2026041`**, **score `1797` bps**, borrower `0x7099…79C8`, collateral `8000` bps.

| Step | Tx |
|------|----|
| `submitScore` | [`0xedc6b25d…088e7`](https://sepolia.etherscan.io/tx/0xedc6b25d32481ab859f11aa3cc513c5cba60e88a427372e2dbf45e32d60888e7) |
| `applyVerifiedScore` | [`0x8c1bbf11…41f37`](https://sepolia.etherscan.io/tx/0x8c1bbf11db02deb92034b416f9a12f682b21ec84493d622651c8f192d3541f37) |

**Demo line for recruiters:** “Oracle stack is deployed on Sepolia with a live verified score; the Operator UI runs the full zk epoch loop on Anvil for speed, or toggles to Sepolia for forge/wallet broadcasts. Connect a Sepolia wallet (authorized prover) for live `submitScore` / `applyVerifiedScore`, or read `latestEpoch` on Epoch / Operator.”

Cost of the EZKL submit/apply run above was ~**0.0027 ETH** at ~2.2 gwei.

#### Circom Sepolia

Separate oracle (different model/adapter commitments and Groth16 verifier):

```bash
SKIP_PROVE=1 bash scripts/deploy_circom_testnet.sh
SKIP_PROVE=1 bash scripts/submit_circom_testnet.sh
```

| Contract | Address |
|----------|---------|
| RiskOracle | [`0x7b9FdfF6223B5E3e5EE1E304852843C44c47EBE7`](https://sepolia.etherscan.io/address/0x7b9FdfF6223B5E3e5EE1E304852843C44c47EBE7) |
| RiskConsumer | [`0x80e7FaD7b0a69ecAb687223174eC5564c6b7E577`](https://sepolia.etherscan.io/address/0x80e7FaD7b0a69ecAb687223174eC5564c6b7E577) |
| CircomRiskScoreVerifier | [`0x76F01b9D1e65770Cb6615AbCc247775fc4e8296a`](https://sepolia.etherscan.io/address/0x76F01b9D1e65770Cb6615AbCc247775fc4e8296a) |
| Groth16Verifier | [`0xFB3c5010311B237fb1C3A1A6048275f9D5dfbfc0`](https://sepolia.etherscan.io/address/0xFB3c5010311B237fb1C3A1A6048275f9D5dfbfc0) |

Latest loop (`contracts/deployments/sepolia-circom-loop-latest.json`): **epoch `2026041`**, **score `5002` bps**, borrower `0x7099…79C8`, collateral `8000` bps.

| Step | Tx |
|------|----|
| `submitScore` | [`0x8f8b4db0…8106c`](https://sepolia.etherscan.io/tx/0x8f8b4db052f976967dfacf3f383e3b1dd1144ec99462172d82635c9ed3e8106c) |
| `applyVerifiedScore` | [`0x8132ad80…3641fe`](https://sepolia.etherscan.io/tx/0x8132ad8045d968d5fffe1d49cbf2d6b5456370d3d5766ccdffba6619903641fe) |
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
| `bash scripts/e2e_circom.sh` | Circom head → Anvil → oracle → consumer |
| `bash scripts/deploy_testnet.sh` | Deploy EZKL stack to Sepolia |
| `bash scripts/submit_testnet.sh` | Sepolia `submitScore` + `applyVerifiedScore` (EZKL) |
| `bash scripts/deploy_circom_testnet.sh` | Deploy Circom stack to Sepolia |
| `bash scripts/submit_circom_testnet.sh` | Sepolia Circom submit + apply |
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

### v0.5.0

- **Operator:** FastAPI service (`operator/`) wrapping e2e, deploy, submit, benchmark with SSE log streaming.
- **UI:** `/operator` dashboard, Run epoch demo CTAs, job queue, EZKL/Circom prover toggle.
- **Security:** borrower field on `ScoreRecord`, public input index 7 binding, consumer `BorrowerMismatch` guard.
- **Testnet:** `scripts/deploy_testnet.sh`, `scripts/submit_testnet.sh`, `deploy_circom_testnet.sh`, `submit_circom_testnet.sh`; Operator Anvil/Sepolia toggle; wallet-signed Sepolia submit/apply; EZKL + Circom addresses in README.
- **Frontend:** wagmi/viem live chain reads, wallet connect, epoch registry pre-flight.

### v0.4.0

- **Security:** `RiskOracle` binds `scoreBps` to EZKL public output limb; `authorizedProvers` ACL on `submitScore`.
- **Benchmarks:** primary table = matched EZKL head vs Circom head; secondary = asymmetric full-vs-head; hybrid amortized cost; `make head-benchmark` syncs frontend.
- **Contracts:** `CircomRiskScoreVerifier`, `CircomProofJsonLib`, `DeployCircom.s.sol`.
- **CI:** GitHub Actions (Foundry, pytest, frontend tsc).
- **Docs:** filled `docs/technical-report.md`.

### v0.3.0

- Frontend live data binding, benchmark harness, threat model polish.
