# benchmarks

Apples-to-apples comparison of the EZKL baseline and custom Circom paths.

Full documentation: [`docs/benchmarks.md`](../docs/benchmarks.md)

## Run

```bash
# from repo root
make benchmark

# options
bash benchmarks/scripts/run.sh --refresh-prove   # regenerate proofs before timing
bash benchmarks/scripts/run.sh --skip-gas        # skip Foundry gas probes
```

## Outputs

| Path | Purpose |
|------|---------|
| `raw-results/bench-latest.json` | Normalized full report |
| `raw-results/bench-latest.csv` | Metric table for spreadsheets |
| `raw-results/bench-latest.md` | Human summary |
| `raw-results/ezkl-latest.json` | EZKL path snapshot |
| `raw-results/circom-latest.json` | Circom path snapshot |
| `plots/*.svg` | Bar charts (constraints, prove time, proof size, gas) |

Stamped copies: `bench-<UTC>.{json,csv,md}`.

## Layout

| Path | Purpose |
|------|---------|
| `zyocra_bench/` | Python harness (first-class code) |
| `scripts/run.sh` | Entry point |
| `raw-results/` | Committed small JSON/CSV/MD |
| `plots/` | Committed SVG charts |

Large proofs/keys remain gitignored in circuit packages.
