# Zyocra — Product messaging

Voice and copy reference for the oracle UI. Implementation: `frontend/src/data/content.ts`, `product-placeholders.ts`, `placeholders.ts`, `config/screens.ts`.

## Positioning

**One line:** Verifiable LoRA risk oracle for DeFi—proves quantized inference off-chain, verifies on EVM, benchmarks EZKL vs Circom.

**Not:** A trading bot, liquidation engine, hosted prover SaaS, or “AI credit score” startup.

**Audience:** zk infrastructure engineers, applied cryptography reviewers, DeFi protocol engineers, hiring managers evaluating depth.

## Voice

| Do | Don't |
|----|-------|
| Precise verbs: attest, verify, commit, admit, emit | Hype: revolutionary, seamless, empower |
| Name artifacts: ONNX, EZKL, Circom, Foundry, Anvil | Vague “AI magic” |
| State guarantees vs non-guarantees explicitly | Imply manipulation-proof markets |
| Use field names engineers expect | Marketing superlatives |
| Short hero lines (infrastructure tone) | Long paragraph heroes |

## Hero formula

```
[Role label]          → eyebrow (mono, dotted)
[Outcome in 4–7 words] → headline
[Mechanism in one sentence] → lede
[Primary CTA]         → verb + object (Inspect epoch, Run prover)
```

**Canonical headline:** Prove inference. Publish score. Adjust collateral.

## Field labels and descriptions

Each data field uses three layers where applicable:

1. **Label** — human-readable name (e.g. “Model hash”)
2. **Description** — what it binds or why it matters
3. **Hint** — units, source, or format under the value

### Core terms

| Field | Description (UI) |
|-------|------------------|
| **Epoch ID** | Time-bounded scoring window binding model, adapter, and verifier set. |
| **Model hash** | Keccak256 of quantized ONNX graph; oracle rejects undeclared graphs. |
| **Adapter hash** | Commitment to LoRA matrices A, B; effective weights W′ = W + AB. |
| **Proof status** | Off-chain prover state: idle → running → generated → verified. |
| **Verifier status** | Result of EVM verify(proof, publicInputs)—simulated or on-chain. |
| **Gas used** | Gas for verify() and oracle path; primary on-chain benchmark axis. |
| **Proof size** | Serialized proof bytes submitted in calldata. |
| **Peak RAM** | Prover process high-water mark during witness + prove. |
| **Collateral factor** | Max borrow per unit collateral; consumer tightens by bucket. |
| **Risk bucket** | Discrete policy band (LOW / MEDIUM / HIGH / CRITICAL) from score thresholds. |

## Screen messaging summary

| Screen | Headline intent |
|--------|----------------|
| Overview | System map + pipeline entry + FAQ |
| Epoch | Commitments for active window |
| Inputs | Deterministic features + quantization |
| Prove | Dual-path prover + artifact metrics |
| Verify | EVM gate + gas |
| Score | Verified output + bucket |
| Impact | Consumer collateral policy |
| Benchmarks | EZKL vs Circom evidence |
| Threat model | Guarantees / non-guarantees |
| Updates | Milestone changelog |

## FAQ themes

1. What statement is proven (inference integrity under commitments)
2. Why two proving paths (compiler vs structured algebra)
3. What an epoch is (commitment boundary)
4. Consumer behavior (policy, not liquidation)
5. Model vs adapter hash (what each commits)
6. Local-first toolchain (no paid infra)
7. What reviewers should inspect first (benchmarks, threat model, tests)

## Changelog tag vocabulary

| Tag | Use |
|-----|-----|
| `UI` | Shell, routes, design |
| `COPY` | Messaging and labels |
| `REPO` | Monorepo layout |
| `ORACLE` | RiskOracle contract |
| `EZKL` | Baseline pipeline |
| `CIRCOM` | Custom circuit path |
| `CONSUMER` | MockLendingConsumer |
| `DOCS` | Documentation |
| `NOTE` | Explicit non-wiring or caveat |

## CTAs

| Context | Copy |
|---------|------|
| Top nav | Run epoch |
| Overview primary | Inspect active epoch |
| Overview secondary | Benchmark comparison |
| Pipeline forward | Review inputs, Run prover, Verify proof, View score, Protocol impact |
| Footer | Run epoch demo |

## Words to avoid

- “Waitlist”, “Join”, “Enterprise”, “Scale with you”
- “Powered by AI”, “Smart”, “Intelligent”
- “Instant liquidation”, “Auto-liquidate”
- Generic “Get Started” without object (prefer “Run epoch demo”)

## Sync checklist

When adding a new data field to the UI:

1. Add label + description to `product-placeholders.ts`
2. If hero/section copy changes, update `screens.ts` or `content.ts`
3. Mirror term in this doc if it is user-facing and security-relevant
4. Add FAQ entry if reviewers will ask about it
