# Zyocra — Screen architecture

Product routes for the zkML DeFi risk oracle shell. Implementation lives in `frontend/src/pages/` with shared config in `frontend/src/config/screens.ts`.

## Route map

| # | Route | Screen | Pipeline step |
|---|-------|--------|---------------|
| 1 | `/` | Landing / Overview | — |
| 2 | `/epoch` | Model Epoch Explorer | 1 |
| 3 | `/inputs` | Input Summary | 2 |
| 4 | `/prove` | Proof Generation | 3 |
| 5 | `/verify` | Proof Verification | 4 |
| 6 | `/score` | Risk Score Result | 5 |
| 7 | `/impact` | Protocol Impact | 6 |
| 8 | `/benchmarks` | Benchmark Comparison | — |
| 9 | `/threat-model` | Threat Model / Guarantees | — |
| 10 | `/updates` | Changelog / Updates | — |

Legacy redirects: `/about` → `/threat-model`, `/blog` → `/updates`.

---

## 1. Landing / Overview (`/`)

**Purpose**  
Orient new users to the oracle system, monorepo layers, and the six-step epoch pipeline before they run a demo.

**Primary user**  
Researcher, reviewer, or engineer landing on the repo for the first time.

**Key actions**  
- Open epoch explorer  
- Jump to benchmarks or threat model  
- Follow pipeline strip to any pipeline screen  

**Primary data shown**  
- End-to-end flow (6 pipeline steps)  
- System layers: ml-base, circuits-baseline, circuits-custom, contracts  
- Headline benchmark metrics (placeholder `—` until Milestone 5)  

---

## 2. Model Epoch Explorer (`/epoch`)

**Purpose**  
Select and inspect the active scoring epoch—model hash, adapter commitments, quantization profile, and verifier deployments.

**Primary user**  
Engineer running or replaying an epoch update.

**Key actions**  
- Review active epoch `epoch-2026-041`  
- Browse historical epoch registry  
- Continue to input summary  

**Primary data shown**  
- `model_hash`, `adapter_hash`, `onnx_commit`, `quant_profile`  
- Verifier addresses (EZKL + Circom)  
- Epoch status, block height, borrower count  

---

## 3. Input Summary (`/inputs`)

**Purpose**  
Display the deterministic borrower feature vector and quantization configuration fed into inference.

**Primary user**  
ML engineer validating exported features and fixed-point scales.

**Key actions**  
- Inspect six tabular features (collateralization, utilization, volatility, etc.)  
- Confirm quantization profile matches circuits  
- Proceed to proof generation  

**Primary data shown**  
- Feature vector fields (`collateralization_ratio`, `debt_utilization`, …)  
- Quantization scales, LoRA rank, `W′ = W + AB`  
- Public input set for verifier (`borrower_id`, commitments)  

---

## 4. Proof Generation (`/prove`)

**Purpose**  
Shell for off-chain proving—EZKL baseline vs Circom custom path—with artifact paths and prover job status.

**Primary user**  
zkML engineer running local prove jobs.

**Key actions**  
- Compare proving paths (EZKL / Circom)  
- View placeholder prover job panel  
- Inspect artifact paths under `circuits-baseline/` and `circuits-custom/`  

**Primary data shown**  
- Path selection cards  
- Constraints, peak RAM, proof time, proof size (placeholder)  
- Artifact file paths  

---

## 5. Proof Verification (`/verify`)

**Purpose**  
On-chain verification step—verifier contract, public inputs, and Foundry tx simulation before oracle submission.

**Primary user**  
Smart contract engineer integrating verifier + oracle.

**Key actions**  
- Review verifier contract and chain ID  
- Validate public input set  
- Inspect simulated `submitScore()` gas and result  

**Primary data shown**  
- `RiskScoreVerifierV1`, Anvil chain ID, proof hash  
- Public inputs aligned with epoch commitments  
- Tx simulation fields (from, to, gas, `verify() → true`)  

---

## 6. Risk Score Result (`/score`)

**Purpose**  
Present verified liquidation-risk score, risk bucket, and quantization drift vs float reference.

**Primary user**  
Risk analyst or protocol engineer interpreting oracle output.

**Key actions**  
- Read fixed-point score and float reference  
- Map score to risk bucket thresholds  
- Continue to protocol impact  

**Primary data shown**  
- `risk_score_q8`, `risk_score_float_ref`, absolute error  
- Bucket thresholds (LOW / MEDIUM / HIGH / CRITICAL)  
- Quantization drift stat tiles  

---

## 7. Protocol Impact (`/impact`)

**Purpose**  
Show how the mock lending consumer updates collateral parameters from a verified score—no model-triggered liquidation.

**Primary user**  
DeFi protocol engineer reviewing consumer behavior.

**Key actions**  
- Inspect collateral factor and spread deltas  
- Review audit trail placeholders  
- Jump to benchmarks or start new epoch  

**Primary data shown**  
- `collateral_factor_before/after`, borrow spread, borrow allowed flag  
- Parameter delta stats  
- Event log placeholders (`ScoreVerified`, `ParamsUpdated`)  

---

## 8. Benchmark Comparison (`/benchmarks`)

**Purpose**  
Central research artifact—EZKL baseline vs Circom LoRA path on constraints, RAM, time, gas, size, and error.

**Primary user**  
Hiring manager, reviewer, or engineer evaluating technical depth.

**Key actions**  
- Read headline comparison table  
- Review reproducibility methodology  
- Locate raw result paths under `benchmarks/`  

**Primary data shown**  
- Six-metric benchmark table (EZKL vs Circom)  
- Methodology bullets  
- Raw JSON and plot paths  

---

## 9. Threat Model / Guarantees (`/threat-model`)

**Purpose**  
Document what the system proves, what it explicitly does not guarantee, and operational assumptions.

**Primary user**  
Security reviewer or auditor scoping the project.

**Key actions**  
- Read guarantees (proof correctness, oracle gate, consumer gate)  
- Read non-guarantees (economic optimality, data honesty, no instant liquidation)  
- Review trusted setup and artifact alignment assumptions  

**Primary data shown**  
- Structured guarantee / non-guarantee prose  
- Assumption list  

---

## 10. Changelog / Updates (`/updates`)

**Purpose**  
Versioned release notes for milestones across the monorepo.

**Primary user**  
Contributors and external reviewers tracking progress.

**Key actions**  
- Browse versioned changelog entries  
- See milestone tags (NEW, NOTE, etc.)  

**Primary data shown**  
- Version, date, tagged release items  

---

## Navigation model

| Surface | Behavior |
|---------|----------|
| **Top nav** | Overview, Epoch, Benchmarks, Threat model, Updates + “Run epoch” CTA |
| **Left rail** | Per-screen section anchors from `screens.ts` |
| **Pipeline strip** | Overview only—jump to any of 6 pipeline routes |
| **Flow nav** | Previous / next on pipeline screens (epoch → impact) |
| **Hero CTAs** | Primary forward action per screen |

## Placeholder data

Realistic demo data lives in `frontend/src/data/product-placeholders.ts` (epoch `2026-041`, borrower `0x9c4f…88a1`, MEDIUM bucket). No backend or prover calls are wired yet.

## Next wiring (out of scope)

- Connect prove/verify pages to `make prove` / Foundry scripts  
- Populate benchmark table from `benchmarks/raw-results/`  
- Drive epoch registry from contracts or local JSON state  
