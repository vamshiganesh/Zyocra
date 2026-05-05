# circuits-custom

Hand-optimized **Circom** path for the LoRA output-head subgraph — Phase 2 benchmark circuit.

Full documentation: [`docs/circom.md`](../docs/circom.md)

## Proof statement (narrow scope)

Proves the integer accumulator for the risk MLP **output head** with explicit low-rank decomposition:

```
logit_acc = ⟨hidden, W_base⟩ + Σ_r A[r] · ⟨B[r,:], hidden⟩
```

- **Public:** `hidden[8]` (backbone Q8.8 activations), `logit_acc`
- **Private:** `weight_base`, `lora_a`, `lora_b`
- **Not in-circuit:** backbone, bias, sigmoid (same boundary as EZKL baseline docs)

## Why this subgraph

LoRA is applied only on the output head in Phase 1. The rank-4 structure allows a fused dot product without materializing \(W' = W + AB\) — the main hand-optimization lever vs a compiler-generated full graph.

## Quick start

```bash
cd circuits-custom
npm install
bash scripts/run_pipeline.sh
```

## Layout

| Path | Purpose |
|------|---------|
| `circom/` | Circuit sources (`lora_output_head.circom` + gates) |
| `zyocra_circom/` | Python fixed-point reference + witness export |
| `fixtures/` | Committed witness vectors |
| `scripts/` | compile → setup → witness → prove → verify |
| `verifiers/` | Generated `LoraHeadVerifier.sol` |

## Tests

```bash
export PYTHONPATH=circuits-custom
../ml-base/.venv/bin/python -m pytest tests/ -q
bash tests/test_circuit.sh
bash tests/test_prove_verify.sh
```
