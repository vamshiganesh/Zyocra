# Zyocra Technical Report

**Version:** v0.4.0 · **Status:** reproducible local benchmark + hardened oracle demo

## 1. Problem statement and scope

Zyocra compares **compiler-generated** (EZKL) and **hand-optimized** (Circom) zero-knowledge circuits for a LoRA-adapted liquidation-risk MLP, with on-chain verification and a mock lending consumer.

**In scope:** proof correctness for declared workloads, oracle storage, collateral policy mapping, reproducible benchmarks.

**Out of scope:** borrower identity in proofs, production trusted setup, core circuit research (recursion/folding), adversarial ML.

## 2. Model and quantization

- Architecture: `6 → 16 → ReLU → 8 → ReLU → head → sigmoid`
- LoRA on output head only: \(W' = W + AB\), rank 4
- Q8.8 fixed-point: `activation_scale=128`, `weight_scale=256`
- Full-model validation (308 test rows): max abs error ~0.0064 vs float32

## 3. EZKL baseline

- Full ONNX graph compiled with EZKL 23.0.5
- Public layout: 6 feature inputs + 1 score output (7 instances after `>> 248`)
- E2E: `scripts/e2e_phase1.sh` → `EzklRiskScoreVerifier` → `RiskOracle` → `RiskConsumer`
- Optional **head-only** ONNX (`ml-base/scripts/export_head_onnx.py`) for comparable benchmark row

## 4. Circom custom path

- Circuit: `lora_output_head.circom` — proves `logit_acc = ⟨h,W⟩ + Σ_r A[r]·⟨B[r,:],h⟩`
- ~89 R1CS constraints, Groth16, local pot12
- `CircomRiskScoreVerifier` implements `IRiskScoreVerifier` (standalone deploy; not oracle-wired)

## 5. On-chain oracle and consumer

### RiskOracle (v0.4 hardening)

| Control | Implementation |
|---------|----------------|
| Proof verification | `IRiskScoreVerifier.verify` |
| Model/adapter hash | Immutable at deploy |
| Epoch monotonicity | `epoch > latestEpoch` |
| Score binding | `scoreBps == ScoreEncoding.scoreBpsFromEzklLimb(publicInputs[6])` |
| Prover ACL | `authorizedProvers[msg.sender]` |

### RiskConsumer

Maps verified `scoreBps` → bucket → collateral factor, spread, borrow gate, mitigation flag. **Global epoch score** — no per-borrower proof binding.

## 6. Benchmark methodology

```bash
make benchmark        # EZKL full + Circom + hybrid + accuracy
make head-benchmark   # also builds EZKL head-only comparable row
```

- Prove timing: median of 3 runs + stdev (`/usr/bin/time -v` on Linux)
- Gas: `BenchmarkGasTest` standalone verifiers
- Environment pinned: `benchmarks/raw-results/env-latest.txt`
- Schema version: `1.1`

## 7. Results (representative WSL2 run)

| Metric | EZKL full | Circom head |
|--------|-----------|-------------|
| Constraints | 964 PLONK rows | 89 R1CS |
| Prove time (median) | ~23 s | ~1.9 s |
| Peak RSS | ~1.7 GB | ~185 MB |
| Verify gas | 536,109 | 244,502 |
| Proof size | ~21 KB | ~804 B |

**Interpretation:** Full-graph EZKL vs Circom head is an **intentional asymmetry** — the research question is where hand-tuned LoRA algebra wins. Use `workloads.ezkl_head` and `accuracy.head_alignment` for comparable head subgraph analysis.

**Hybrid model:** one full EZKL prove/epoch + Circom head prove/update → see `workloads.hybrid.amortized_prove_ms_per_update`.

## 8. Engineering complexity

| Path | Pros | Cons |
|------|------|------|
| EZKL | End-to-end ONNX, Halo2 verifier wired to oracle | Large pk (~600MB), slow prove |
| Circom | Small circuit, fast prove, transparent gates | Subgraph only, GPL verifier, local ceremony |
| Head EZKL | Compiler baseline for same statement as Circom | Extra compile/setup; still larger than hand circuit |

## 9. Threat model summary

- **Fixed:** score↔public-input binding, authorized provers
- **Open:** borrower binding, verifier timelock, Circom→oracle score semantics, production ceremony

Full detail: [`threat-model.md`](threat-model.md).

## 10. Limitations and future work

1. Borrower identity in public inputs (circuit v2)
2. Verifier governance (timelock / multisig)
3. Multi-sample prove benchmarks across all `sample_indices`
4. Production ptau for Circom
5. Rust/halo2 gadget port (optional depth signal)

---

Related: [`architecture.md`](architecture.md), [`benchmarks.md`](benchmarks.md), [`e2e-phase1.md`](e2e-phase1.md).
