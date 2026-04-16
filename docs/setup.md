# Zyocra — Local Development Setup (Ubuntu WSL)

Local-first, free toolchain. No paid RPCs, no Docker (yet), no cloud accounts.

## Phase-1 toolchain decisions

| Choice | Decision | Why |
|--------|----------|-----|
| JS package manager | **pnpm** | Workspace-friendly when an optional UI lands |
| Optional UI | **Vite + React** | Design shell only; does not block milestones 1–5 |
| Contracts | **Foundry** | Local `forge test` / `anvil` |
| ML | **Python venv + PyTorch CPU + ONNX** in `ml-base/.venv` | Reproducible, free, no CUDA |
| zkML baseline | **EZKL Python API** (`import ezkl`) | Milestone 2 default path |
| Custom circuits | **Circom** | Milestone 3; present on host when available |
| Docker | **Not used yet** | Avoid extra complexity |
| Git hooks | **None yet** | Keep install lightweight |

## Host tools

| Tool | Role |
|------|------|
| Node.js + pnpm | Optional frontend tooling |
| Python 3 + `venv` | `ml-base` training / export / EZKL API |
| Rust (`rustc` / `cargo`) | Circom ecosystem builds |
| Foundry (`forge` / `cast` / `anvil`) | Oracle + consumer contracts |
| Circom | Custom circuit path (Milestone 3) |

**Installed by `make install` into `ml-base/.venv`:** PyTorch (CPU), ONNX, ONNX Runtime, NumPy, EZKL (Python API).

## Host install commands (fresh Ubuntu WSL)

Run only if `make check-tools` reports something missing.

### Node.js LTS + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo corepack enable
corepack prepare pnpm@latest --activate
node -v && pnpm -v
```

### Python 3 + venv

```bash
sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip python3-dev build-essential
python3 --version
python3 -m venv -h >/dev/null && echo "venv ok"
```

### Rust toolchain

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version && cargo --version
```

### Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
source "$HOME/.bashrc"
foundryup
forge --version && cast --version && anvil --version
```

### Circom (needed by Milestone 3)

```bash
cargo install --git https://github.com/iden3/circom.git circom
circom --version
```

`snarkjs` and Powers of Tau artifacts wait until Circom circuits exist.

### Do not install for default milestones

- Docker / Kubernetes
- Paid RPC URLs or hosted provers
- CUDA toolkits (CPU PyTorch is enough for the small tabular model)

## Project install (every clone)

From the repo root (`~/projects/zyocra/Zyocra`):

```bash
make install
```

What it does:

1. Checks Node, pnpm, Python, Rust, Foundry are on `PATH`
2. Creates `ml-base/.venv` if needed
3. Installs **CPU** PyTorch from the official CPU wheel index
4. Installs `onnx`, `onnxruntime`, `numpy`, `ezkl` into the venv
5. Skips frontend/contracts package installs until those packages are initialized
6. Ensures `benchmarks/raw-results/` and `benchmarks/plots/` exist

Activate the ML environment:

```bash
source ml-base/.venv/bin/activate
```

**Note:** The `ezkl` PyPI package exposes a **Python API** (`import ezkl`), not a standalone CLI binary.

## Exact run commands

| Goal | Command | What it runs |
|------|---------|--------------|
| Help | `make help` | Lists targets |
| Tool versions | `make check-tools` | Host + venv versions |
| Install deps | `make install` | `./scripts/install.sh` |
| Dev server | `make dev` | Optional UI when present |
| Tests | `make test` | Foundry / Python smoke / frontend |
| Lint | `make lint` | `bash -n`, forge fmt, pnpm lint, optional ruff |
| Benchmark snapshot | `make benchmark` | `benchmarks/raw-results/env-*.json` + `.md` |

```bash
./scripts/install.sh
./scripts/dev.sh
./scripts/test.sh
./scripts/lint.sh
./scripts/benchmark.sh
```

### After packages are implemented (future)

```bash
# ML / EZKL
source ml-base/.venv/bin/activate
python -c "import torch, onnx, ezkl; print('ok')"

# Contracts
cd contracts && forge build && forge test
cd contracts && anvil

# Optional UI
cd frontend && pnpm install && pnpm dev
```

## Benchmark outputs

- Commit small reports under `benchmarks/raw-results/` and charts under `benchmarks/plots/`
- Keep large proofs/keys out of git
- Oversized weights/proofs may live under `~/projects/zyocra/` (parent of this repo)

## Local-only vs published

| Path | Published to GitHub? |
|------|----------------------|
| Source, docs, scripts, small benchmark reports | Yes |
| `.cursor/` | No (gitignored) |
| `importantData/` | No (gitignored) |
| `ml-base/.venv/` | No (gitignored) |
| Large artifacts under `~/projects/zyocra/` | No (outside repo) |

## Troubleshooting

**`make install` fails on missing tools** — install from sections above, new shell, `make check-tools`.

**PyTorch wants CUDA** — re-run `make install` (CPU wheel index is forced).

**`import ezkl` fails** — `source ml-base/.venv/bin/activate` or `make install`. Use the Python API, not a CLI.

**Foundry downloads solc** — one-time network fetch; no paid service.
