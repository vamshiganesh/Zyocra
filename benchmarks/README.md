# benchmarks

Apples-to-apples comparison of the EZKL baseline and custom Circom paths on the same logical workload.

## Layout

| Path | Purpose |
|------|---------|
| `scripts/` | Reproducible benchmark harnesses |
| `raw-results/` | Commit small `*.json`, `*.csv`, `*.md` reports |
| `plots/` | Commit small `*.svg`, `*.png` charts |

Large proofs/keys (`*.proof`, `*.pk`, `*.vk`, `*.bin`) are gitignored.

## Required metrics (target)

| Metric | EZKL baseline | Custom Circom |
|--------|---------------|---------------|
| Constraint count | from generated artifacts | from hand-written artifacts |
| Prover peak RAM | during prove | during prove |
| Proof generation time | end-to-end | end-to-end |
| Verification gas | EVM verifier call | EVM verifier call |
| Proof size | bytes | bytes |
| Numerical accuracy loss | float vs fixed-point | float vs fixed-point |
| Engineering complexity | notes | notes |

## Methodology (must stay explicit)

- Same machine specs
- Same input batch assumptions
- Same model family and quantization level
- Same public input/output exposure policy
- Same gas-measurement harness

## Run

```bash
# from repo root
make benchmark
```

Writes an environment snapshot under `raw-results/` until full prove/verify benches land (Milestone 5).
