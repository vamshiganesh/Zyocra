# circuits-custom

Hand-optimized Circom path for LoRA-structured inference subgraphs.

Targets the workload where low-rank structure is most optimizable:

- LoRA delta application \(W' = W + AB\)
- Dense-layer dot products using \(W'\)
- Optional activation approximation gadgets

## Layout

| Path | Purpose |
|------|---------|
| `circom/` | Circuit sources and templates |
| `inputs/` | Public/private input fixtures |
| `witnesses/` | Generated witnesses (local) |
| `proofs/` | Proof artifacts (large binaries gitignored) |

## Proof statement (target)

For public input \(x\), base-weight commitment \(h_W\), adapter commitments \(h_A\), \(h_B\), and public output \(y\):

\[
y = f((W + AB)x + b)
\]

under declared quantization and activation approximation rules.

Milestone 3 implements this path. Placeholders only for now.
