# Product

## Positioning

**Zyocra** is a benchmark-driven zkML oracle for DeFi that compares compiler-generated and hand-optimized zero-knowledge circuits for LoRA-adapted risk inference, with on-chain verification and dynamic collateral-parameter updates in a mock lending protocol.

Public name: **Zyocra**. Technical framing: **Verifiable LoRA Risk Oracle**.

## Problem

DeFi lending systems use risk signals to adjust collateralization and borrowing conditions. zkML stacks such as EZKL make verifiable inference practical end-to-end, but compiler-generated circuits can hide arithmetic inefficiencies—especially for structured low-rank updates like LoRA (\(W' = W + AB\)).

This project answers a concrete engineering question: **are EZKL-generated circuits materially suboptimal for LoRA-adapted tabular risk inference compared with a hand-designed Circom circuit on the same logical workload?**

## Goals

1. Run a quantized DeFi liquidation-risk model off-chain.
2. Apply LoRA-adapted weights (\(W' = W + AB\)).
3. Produce a zk proof that the published score was computed correctly.
4. Verify the proof on-chain (Solidity verifier via Foundry).
5. Update a mock lending consumer’s borrower risk bucket and collateral parameters from verified output.
6. Benchmark the full EZKL path against a hand-optimized Circom implementation.

## Non-goals

- Proving full model training in ZK.
- Real-time trading or instant model-triggered liquidations.
- Claiming the model is economically optimal or manipulation-proof at market level.
- Paid RPCs, hosted provers, or cloud infra for the default local workflow.

## Users

| Audience | What they get |
|----------|----------------|
| Technical reviewers / hiring managers | Benchmark table, threat model, reproducible local demo |
| zk / applied crypto engineers | Dual proving paths, quantization analysis, circuit gadgets |
| DeFi engineers | Oracle → risk-bucket → collateral parameter flow (mock) |

## Demo action (consumer)

The consumer adjusts **collateral parameters by risk bucket**, not liquidations:

| Bucket | Behavior |
|--------|----------|
| Low | Standard collateral factor |
| Medium | Lower collateral factor, higher borrow spread |
| High | Freeze new borrowing, tighten thresholds |
| Critical | Flag for delayed mitigation |

## Local-first policy

Everything required for milestones runs on Ubuntu WSL with free tools (Python, PyTorch CPU, ONNX, EZKL, Circom, Foundry, Anvil). No paid services unless explicitly requested.
