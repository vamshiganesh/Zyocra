# Threat model

Clear separation between **what proofs guarantee** and **what they do not**.

## Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| Published score matches declared model graph and quantized weights under the proof system | EZKL or Circom proof + public inputs |
| Oracle accepts only outputs with a valid proof for the expected verifier | Solidity verifier check in oracle contract |
| Consumer updates state only from verified oracle outputs | Consumer reads oracle-mediated, verified scores only |

## Non-guarantees

| Non-guarantee | Why it is out of scope |
|---------------|------------------------|
| Model is economically optimal | Scoring quality is an ML/product concern, not a proof property |
| Dataset is unbiased | Training data integrity is not attested by the circuit |
| Risk score is manipulation-proof at market level | Adversarial market behavior and oracle deviation are separate DeFi risks |
| Underlying data feeds are always honest | Feature inputs may be public or semi-public; source honesty is not proven |

## Trust assumptions (explicit)

1. **Setup integrity:** proving-system parameters / SRS handling follows the chosen stack’s documented local workflow.
2. **Model and adapter commitments:** parties agree on hashes (or commitments) for \(W\), \(A\), \(B\) (or the exported ONNX graph) before accepting scores for an epoch.
3. **Quantization policy:** float vs fixed-point rules are declared and shared by provers and verifiers; accuracy loss is measured, not hidden.
4. **Operator honesty for off-chain inputs:** if features are supplied off-chain, the proof attests correct **computation**, not that market data was unmanipulated.
5. **No upgradeability in early milestones:** verifiers and consumer logic are simple, auditable contracts without proxy indirection unless later required.

## Preferred consumer action

Dynamic **collateral-parameter** adjustment by risk bucket is in scope. Instant model-triggered liquidation is **out of scope** for the demo and threat narrative.

## Implications for implementation

- Document invariants and trust assumptions in contract NatSpec.
- Benchmark and README must not claim economic safety from proof validity alone.
- Update this file when public inputs, commitment schemes, or consumer privileges change.
