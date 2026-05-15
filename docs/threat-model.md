# Threat model

Security and trust boundaries for Zyocra Phase 1. This document separates **proof correctness** from **model quality**, **data honesty**, and **economic safety**.

Scope: local-first demo (`ml-base` → `circuits-baseline` / `circuits-custom` → `contracts`). Not a production audit.

---

## System overview

```text
Off-chain                          On-chain
─────────                          ────────
features ──► ML inference ──► prove ──► RiskOracle.submitScore()
              (quantize)          │         │ verify(proof, publicInputs)
                                  │         │ check model/adapter hashes, epoch
                                  ▼         ▼
                            witness/proof   ScoreRecord (epoch, scoreBps, …)
                                              │
                                              ▼
                                    RiskConsumer.applyVerifiedScore(borrower, epoch)
                                              │
                                              ▼
                                    BorrowerPolicy (collateral factor, spread, …)
```

Two proving paths exist:

| Path | Circuit scope | On-chain verifier (Phase 1) |
|------|---------------|-----------------------------|
| **EZKL** | Full ONNX graph (6→16→8→1 + sigmoid) | `Halo2Verifier` via `EzklRiskScoreVerifier` |
| **Circom** | LoRA output head only (`lora_output_head`) | `LoraHeadVerifier` (Groth16) — benchmark / future adapter |

Only the EZKL path is wired end-to-end in `e2e_phase1.sh`. Circom is a subgraph benchmark, not a drop-in oracle replacement.

---

## 1. What the proof guarantees

### EZKL baseline (full graph)

Given:

- A committed ONNX graph compiled with declared EZKL settings (`circuits-baseline/settings/settings.json`),
- Fixed-point scales (`input_scale=7`, `param_scale=7` → Q8.8 alignment with `ml-base`),
- Public feature vector and public output score encoded in `publicInputs`,

the proof attests that the **published risk score is the result of executing the exported, quantized model** on those inputs under the circuit's arithmetic (including documented approximations: ReLU, sigmoid, bias handling).

Off-chain `ezkl.verify()` and on-chain `Halo2Verifier.verifyProof()` check the same statement for a given `(proof, publicInputs)` pair.

### Circom custom path (subgraph)

Given:

- Private `weight_base`, `lora_a`, `lora_b` and public `hidden[8]`,

the proof attests:

```text
logit_acc = ⟨hidden, W_base⟩ + Σ_r A[r] · ⟨B[r,:], hidden⟩
```

in integer fixed-point (Q8.8 grids). Bias and sigmoid are **out of circuit** by design.

### On-chain acceptance (both paths, when wired)

`RiskOracle.submitScore` accepts a submission only if:

1. `modelHash` and `adapterHash` match immutable deploy-time commitments.
2. `epoch` is strictly greater than `latestEpoch` (monotonic epochs).
3. `scoreBps` is in `[0, 10_000]` (via `bucketForScore()`).
4. `verifier.verify(proof, publicInputs)` returns true.

The consumer reads **only** scores that passed these checks for a verified epoch.

---

## 2. What the proof does not guarantee

| Non-guarantee | Detail |
|---------------|--------|
| **Model is economically correct** | A faithfully proven bad model is still a bad model. |
| **Training data is unbiased or complete** | Dataset integrity is outside the circuit. |
| **Features reflect true on-chain / market state** | Proofs attest correct **computation**, not honest **inputs**. |
| **Quantization matches float32 everywhere** | Documented drift (bias in float, sigmoid off-circuit in Circom head path; EZKL uses declared export rules). |
| **Borrower binding** | EZKL public layout is 6 features + 1 score; there is no per-borrower identity in the proof or oracle record. |
| **Circom alone proves end-to-end risk score** | Circom proves a head-layer accumulator, not full inference from raw features. |
| **Liveness / ordering** | Anyone can submit a valid proof if they possess one; no access control on `submitScore`. |
| **Verifier immutability** | Oracle owner can call `setVerifier`; see §3. |

**Proof validity ≠ protocol safety.** Valid proofs mean the declared computation occurred; they do not mean borrowers are well-priced or manipulation-resistant.

---

## 3. What the oracle contract assumes

`RiskOracle` (`contracts/src/RiskOracle.sol`):

### Cryptographic / setup

- The deployed `IRiskScoreVerifier` correctly implements verification for the intended circuit.
- EZKL: SRS (`kzg.srs`), `vk`/`pk`, and generated `Halo2Verifier.sol` correspond to the compiled `network.ezkl` artifact used off-chain.
- Circom (if used): Groth16 proving key matches `LoraHeadVerifier.sol`; trusted setup assumptions hold for the ceremony in use (local `pot12` in dev is **not** production-grade).

### Commitments

- `committedModelHash` and `committedAdapterHash` are set correctly at deploy and match the weights the prover uses.
- Parties off-chain agree that these hashes represent the intended ONNX graph and LoRA adapter before trusting scores.

### Operational

- **Owner trust:** `owner` can rotate verifiers via `setVerifier` without timelock or governance in Phase 1.
- **Submitter trust:** `submitScore` requires `authorizedProvers[msg.sender]`; owner grants provers via `setAuthorizedProver`. Deploy-time owner is authorized by default.
- **Calldata consistency:** `submitScore` asserts `payload.scoreBps == ScoreEncoding.scoreBpsFromEzklLimb(publicInputs[6])` after verification (7-element EZKL layout).
- **Epoch semantics:** Epoch IDs are opaque monotonic counters; the contract does not validate wall-clock windows or calendar meaning.

### Out of scope for the oracle

- Feature ingestion, prover liveness, proof ordering among competing submitters.
- Slashing or economic penalties for wrong scores.

---

## 4. What the consumer contract assumes

`RiskConsumer` (`contracts/src/RiskConsumer.sol`):

### Trust upstream

- `IRiskOracle` at the configured address is the intended, uncompromised oracle.
- `oracle.isEpochVerified(epoch)` implies a proof-verified score for that epoch.
- The **global epoch score** applies to whichever `borrower` is passed to `applyVerifiedScore` — there is no per-borrower score on-chain.

### Policy semantics

- Bucket thresholds (`RiskBuckets`) and collateral parameters (`RiskPolicies`) are **hard-coded** in Solidity, not proven or governed on-chain.
- Policy is **deterministic** from `scoreBps` → bucket → `{collateralFactorBps, borrowSpreadBps, borrowAllowed, mitigationFlag}`.
- `applyVerifiedScore` is permissionless; any address can trigger policy application for any borrower (updates are idempotent per `(borrower, epoch)` via `lastEpoch`).

### Explicit non-goals

- Not a liquidation engine; `mitigationFlag` is a demo signal only.
- Does not read borrower positions, debt, or collateral balances.
- Does not verify that the borrower's off-chain features were used in the proof.

---

## 5. Data-source trust assumptions

### Feature pipeline (`ml-base`)

- Phase 1 uses a **deterministic synthetic dataset** (`SYNTHETIC_SAMPLES`, fixed seed). No external price oracles.
- Feature engineering (`scripts/engineer_features.py`) is trusted code; outputs are not proven on-chain.
- Min-max normalization bounds in `feature_stats.json` are assumed correct at export time.

### Public inputs in EZKL

Layout (7 field elements after `>> 248` rescale):

- Indices `0..5`: normalized feature values (public).
- Index `6`: risk score output (public).

The proof binds computation to these **committed public values**, not to an external data provider's reputation.

### Hidden / private inputs in Circom

- Backbone hidden activations are public in `lora_output_head`; weights are private witness values.
- A prover with witness knowledge can prove any consistent `(hidden, weights) → logit_acc` tuple; the circuit does not attest how `hidden` was produced.

### Future production gap

Live DeFi integration would require explicit trust assumptions for: price feeds, indexers, borrower identity, and feature staleness — none are in scope for Phase 1.

---

## 6. Model quality vs proof correctness

| Concern | Layer | Attested by zk? |
|---------|-------|-----------------|
| "Was inference executed as specified?" | Proof / verifier | **Yes** (for in-circuit ops) |
| "Is the model well-calibrated?" | ML / product | **No** |
| "Are weights the right weights?" | Commitments (`modelHash`, `adapterHash`) | **Partially** — hashes bind to declared artifacts, not economic truth |
| "Does fixed-point match float?" | Quantization | **Measured** (`ml-base` validation); not cryptographically exact |
| "Is LoRA adaptation beneficial?" | Training | **No** |

A **valid proof of a misspecified model** is a first-class failure mode. Benchmarks report quantization error separately from proof validity.

---

## 7. Replay and staleness considerations

### Epoch monotonicity

- `submitScore` reverts if `epoch <= latestEpoch` (`StaleEpoch`).
- Prevents re-submitting the same epoch id; does **not** prevent submitting arbitrarily high epoch ids.

### Consumer idempotency

- `applyVerifiedScore` reverts if `policy.lastEpoch >= epoch` (`AlreadyApplied`).
- A borrower can lag behind `latestEpoch`; policy is not auto-applied.

### Proof replay

- The same `(proof, publicInputs)` could be submitted again only with a **new** `epoch` — but the proof's public inputs typically include fixed features/score, so replay with a bumped epoch may fail verification unless the circuit allows epoch as a public input (it does not in Phase 1).
- Old epoch scores remain readable via `getScoreByEpoch`; there is no on-chain expiry.

### Staleness

- No `block.timestamp` window ties epochs to calendar time.
- Consumer policy can reflect a verified score from an older epoch if integrators call `applyVerifiedScore` late.
- Off-chain features can be stale relative to market; the system does not detect this.

### Front-running

- `submitScore` is public; mempool observers can see pending submissions. No commit-reveal scheme.

---

## 8. Benchmark integrity assumptions

Results in `benchmarks/raw-results/bench-latest.json` assume:

| Assumption | Risk if violated |
|------------|------------------|
| Same machine runs both paths | Cross-host numbers not comparable without re-run |
| Documented tool versions (EZKL 23.0.5, circom 2.2.x) | Version skew changes constraints/timing |
| **Different workloads** (EZKL full graph vs Circom head subgraph) | Headline ratios are not end-to-end equivalence |
| Different proof systems (Halo2/KZG vs Groth16) | Constraint counts and gas not same-unit |
| Median of 3 prove runs, single `sample_index=0` | No confidence intervals; high variance possible |
| `/usr/bin/time -v` on Linux for RSS | RAM metric absent on other OS |
| Gas from standalone `BenchmarkGasTest`, not full `submitScore` | Understates full oracle path cost |
| Local Circom `pot12` ceremony | Not production trusted setup |
| Accuracy rows measure different things | EZKL: 308-row test split; Circom: single fixture integer check |

Benchmark scripts are first-class code (`benchmarks/zyocra_bench/`). Results should be reproduced with `make benchmark` and the committed methodology in `docs/benchmarks.md` — not hand-edited spreadsheets.

**Do not** infer production oracle economics from benchmark tables without reading `limitations` in the report JSON.

---

## 9. Open risks and future work

### High priority (implementation)

1. ~~**Bind `scoreBps` to `publicInputs` on-chain**~~ — **Done** (`ScoreEncoding` + `PublicInputLayout` in `RiskOracle.submitScore`).
2. **Borrower / identity binding** — if per-borrower scores are required, extend public inputs and oracle schema.
3. **Verifier governance** — timelock, multisig, or immutable verifier for production; document upgrade path for `setVerifier`.
4. ~~**Circom oracle adapter**~~ — **Done** (`CircomRiskScoreVerifier` + `CircomProofJsonLib`); full `RiskOracle` wiring deferred (logit_acc vs scoreBps semantics).

### Medium priority

5. ~~**Access control on `submitScore`**~~ — **Done** (`authorizedProvers` + `setAuthorizedProver`).
6. **Epoch time windows** — optional `validUntil` or minimum block spacing per epoch.
7. **Feature commitment** — hash feature vector in public inputs with explicit layout versioning.
8. **Consumer authorization** — restrict who may call `applyVerifiedScore` or tie to oracle events.

### Lower priority / research

9. **Production trusted setup** for Circom (Hermez/POT ceremony).
10. **Formal verification** of bucket thresholds vs documented policy.
11. **Adversarial ML** — poisoning, feature manipulation at source (out of circuit scope).
12. **Cross-chain / L2** — verifier address consistency, calldata cost on rollups.

---

## Summary table

| Layer | Trusts | Does not trust |
|-------|--------|----------------|
| **Proof** | Arithmetic, commitments in circuit, verifier soundness | Data sources, model quality, economic optimality |
| **Oracle** | Verifier impl, deploy-time hashes, monotonic epochs, score↔public-input binding, authorized provers | Submitter identity beyond ACL, feature honesty, borrower in proof |
| **Consumer** | Oracle verified scores, hard-coded policy | Borrower-feature linkage, position state, liquidation safety |
| **Benchmarks** | Scripted harness, pinned versions | Cross-workload equivalence, statistical robustness |

---

## Maintenance

Update this document when any of the following change:

- Public input layout or visibility (EZKL settings, Circom I/O)
- `RiskOracle` payload fields or verifier interface
- `RiskConsumer` policy tables or authorization model
- Benchmark methodology or workload scope
- Trusted setup or verifier deployment process

Related: [`docs/architecture.md`](architecture.md), [`docs/benchmarks.md`](benchmarks.md), [`docs/e2e-phase1.md`](e2e-phase1.md).
