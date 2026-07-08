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
| RiskOracle | [`0x95212e13B02C26bE0A4505e5671533C013e04357`](https://sepolia.etherscan.io/address/0x95212e13B02C26bE0A4505e5671533C013e04357) |
| RiskConsumer | [`0xE7717a9a7b37177ce41140A475a53294Ab35a03c`](https://sepolia.etherscan.io/address/0xE7717a9a7b37177ce41140A475a53294Ab35a03c) |
| EzklRiskScoreVerifier | [`0x448d840d97503c5b3C4bC4dfa8899168f052fBDA`](https://sepolia.etherscan.io/address/0x448d840d97503c5b3C4bC4dfa8899168f052fBDA) |
| Halo2Verifier | [`0xC8ecEcc7E6Ca6761B117A96Da97F50d11438dC12`](https://sepolia.etherscan.io/address/0xC8ecEcc7E6Ca6761B117A96Da97F50d11438dC12) |

Latest loop (`contracts/deployments/sepolia-loop-latest.json`): **epoch `2026041`**, **score `1797` bps**, borrower `0x7099…79C8`, collateral `8000` bps.

| Step | Tx |
|------|----|
| `submitScore` | [`0x54b58347…eee0`](https://sepolia.etherscan.io/tx/0x54b58347d9f56ed28e47fe28980240a7fb3a12738757b07c85d3ee854c09eee0) |
| `applyVerifiedScore` | [`0xcf7470fb…9171`](https://sepolia.etherscan.io/tx/0xcf7470fb984e501903a29f910ac95555b6860d27a845e204cec83723efb59171) |

**Demo line for recruiters:** “Oracle stack is deployed on Sepolia with a live verified score; the Operator UI runs the full zk epoch loop on Anvil for speed, or toggles to Sepolia for forge/wallet broadcasts. Connect a Sepolia wallet (authorized prover + applicator) for live `submitScore` / `applyVerifiedScore`, or read `latestEpoch` on Epoch / Operator.”

Cost of the EZKL submit/apply run above was ~**0.0020 ETH** at ~2.2 gwei (deploy of the full stack was a separate ~0.012 ETH).

#### Circom Sepolia

Separate oracle (different model/adapter commitments and Groth16 verifier):

```bash
SKIP_PROVE=1 bash scripts/deploy_circom_testnet.sh
SKIP_PROVE=1 bash scripts/submit_circom_testnet.sh
```

| Contract | Address |
|----------|---------|
| RiskOracle | [`0xdc5E502DC59a4d65e18E5F045711401710f309f1`](https://sepolia.etherscan.io/address/0xdc5E502DC59a4d65e18E5F045711401710f309f1) |
| RiskConsumer | [`0x0E64bB23Af32307F1228e1379d77Bc7AD2739359`](https://sepolia.etherscan.io/address/0x0E64bB23Af32307F1228e1379d77Bc7AD2739359) |
| CircomRiskScoreVerifier | [`0x3987E23ce8f089530Fd21D8bCa9D3f79b3403429`](https://sepolia.etherscan.io/address/0x3987E23ce8f089530Fd21D8bCa9D3f79b3403429) |
| Groth16Verifier | [`0x346124ddBfBa8254Ad937702d07454C8293f4494`](https://sepolia.etherscan.io/address/0x346124ddBfBa8254Ad937702d07454C8293f4494) |

Latest loop (`contracts/deployments/sepolia-circom-loop-latest.json`): **epoch `2026041`**, **score `10000` bps** (saturated demo logit after in-circuit borrower rebuild), borrower `0x7099…79C8`, collateral `5000` bps.

| Step | Tx |
|------|----|
| `submitScore` | [`0x51515f8f…f270`](https://sepolia.etherscan.io/tx/0x51515f8ffb6fd64794a67f224a13c0e496d1dcfe95deb77ad8c9132ac4d8f270) |
| `applyVerifiedScore` | [`0x90025223…6a65`](https://sepolia.etherscan.io/tx/0x9002522356b870cdfc3e4ec25d2fedc837a60c86d60e6015fc550e5accbc6a65) |
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
- **Security:** Circom in-circuit borrower; `RiskConsumer.authorizedApplicators`; cubic Taylor Circom score encoding (Python↔Solidity).
- **Benchmarks:** `PROVE_RUNS=10` head bakeoff artifacts under `benchmarks/raw-results/`.

- **Frontend:** wagmi/viem live chain reads, wallet connect, epoch registry pre-flight.

### v0.4.0

- **Security:** `RiskOracle` binds `scoreBps` to EZKL public output limb; `authorizedProvers` ACL on `submitScore`.
- **Benchmarks:** primary table = matched EZKL head vs Circom head; secondary = asymmetric full-vs-head; hybrid amortized cost; `make head-benchmark` syncs frontend.
- **Contracts:** `CircomRiskScoreVerifier`, `CircomProofJsonLib`, `DeployCircom.s.sol`.
- **CI:** GitHub Actions (Foundry, pytest, frontend tsc).
- **Docs:** filled `docs/technical-report.md`.

### v0.3.0

- Frontend live data binding, benchmark harness, threat model polish.
