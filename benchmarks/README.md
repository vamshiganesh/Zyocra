# benchmarks

Local, reproducible benchmark outputs for prove/verify timings, proof sizes, and charts.

## Layout

- `results/` — commit small reports here (`*.json`, `*.csv`, `*.md`, `*.svg`, `*.png`)
- Large binaries (`*.proof`, `*.pk`, `*.vk`, `*.bin`) are gitignored

## Run

```bash
# from repo root
make benchmark
```

Writes a timestamped summary under `benchmarks/results/`.
