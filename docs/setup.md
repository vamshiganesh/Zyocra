# Zyocra — Local Development Setup (Ubuntu WSL)

Local-first, free toolchain. No paid RPCs, no Docker (yet), no cloud accounts.

## What this machine already had

On the current WSL Ubuntu host, these were already present:

| Tool | Version (observed) | Role |
|------|--------------------|------|
| Node.js | v24.x LTS-line | Frontend tooling |
| pnpm | 11.x | JS package manager (preferred over npm for future monorepo) |
| Python 3 | 3.12 + `venv` | ML export / EZKL Python API |
| Rust (`rustc` / `cargo` / `rustup`) | 1.94 | EZKL ecosystem / Circom builds |
| Foundry (`forge` / `cast` / `anvil`) | 1.5.x | Oracle + mock lending contracts |
| Circom | 2.2.x | Optional custom-circuit benchmark path |
| Git, Make, curl | system | Repo + task runner |

**Installed by `make install` (project-local):**

| Tool | Location | Role |
|------|----------|------|
| PyTorch (CPU) | `model/.venv` | Small quantized model work |
| ONNX / ONNX Runtime | `model/.venv` | Model export / inference path into EZKL |
| EZKL | `model/.venv` | Phase-1 zkML baseline proving path |

## Phase-1 toolchain decisions

| Choice | Decision | Why |
|--------|----------|-----|
| JS package manager | **pnpm** | Already installed; cleaner disk use and workspace support when `frontend/` lands |
| Frontend | **Vite + React** (when scaffolded) | Design-heavy product shell, fast HMR, no SSR/cloud hosting requirement for phase 1 |
| Contracts | **Foundry** | Local `forge test` / `anvil`; no Infura/Alchemy |
| ML | **Python venv + PyTorch CPU + ONNX** | Reproducible, free, no CUDA/cloud GPU |
| zkML baseline | **EZKL** (in venv) | Default prove/verify path |
| Circom | Present on host; **not required** to start phase 1 | Benchmark path only |
| Docker | **Not used yet** | Avoid extra complexity |
| Git hooks | **None yet** | Keep install lightweight |

## Host install commands (fresh Ubuntu WSL)

Run these only if `make check-tools` reports something missing.

### Node.js LTS + pnpm

```bash
# Node via NodeSource LTS (or use nvm if you prefer)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Enable corepack and activate pnpm
sudo corepack enable
corepack prepare pnpm@latest --activate

node -v
pnpm -v
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
rustc --version
cargo --version
```

### Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
# restart shell or:
source "$HOME/.bashrc"
foundryup
forge --version
cast --version
anvil --version
```

### Circom (optional until benchmark path)

Already optional for phase 1. If needed later:

```bash
# requires Rust
cargo install --git https://github.com/iden3/circom.git circom
circom --version
```

`snarkjs` and Powers of Tau artifacts can wait until Circom circuits exist.

### Do not install for phase 1

- Docker / Kubernetes
- Paid RPC URLs or hosted provers
- CUDA toolkits (CPU PyTorch is enough for the small model)

## Project install (every clone)

From the repo root (`~/projects/zyocra/Zyocra`):

```bash
make install
```

What it does:

1. Checks Node, pnpm, Python, Rust, Foundry are on `PATH`
2. Creates `model/.venv`
3. Installs **CPU** PyTorch from the official CPU wheel index
4. Installs `onnx`, `onnxruntime`, `numpy`, `ezkl` into the venv
5. Skips frontend/contracts package installs until those packages are scaffolded
6. Ensures `benchmarks/results/` exists

Activate the ML environment when working on model/prover code:

```bash
source model/.venv/bin/activate
```

## Exact run commands

| Goal | Command | What it runs |
|------|---------|--------------|
| Help | `make help` | Lists targets |
| Tool versions | `make check-tools` | Prints host + venv tool versions |
| Install deps | `make install` | `./scripts/install.sh` |
| Dev server | `make dev` | `./scripts/dev.sh` → `pnpm dev` in `frontend/` when present |
| Tests | `make test` | `./scripts/test.sh` (Foundry / Python smoke / frontend) |
| Lint | `make lint` | `./scripts/lint.sh` (bash -n, forge fmt, pnpm lint, optional ruff) |
| Benchmark snapshot | `make benchmark` | `./scripts/benchmark.sh` → `benchmarks/results/env-*.json` + `.md` |

Direct script equivalents (same behavior):

```bash
./scripts/install.sh
./scripts/dev.sh
./scripts/test.sh
./scripts/lint.sh
./scripts/benchmark.sh
```

### After packages are scaffolded (future)

```bash
# Frontend (Vite React, planned)
cd frontend && pnpm install && pnpm dev

# Contracts
cd contracts && forge build && forge test
cd contracts && anvil   # local chain, free

# ML / EZKL (venv active)
source model/.venv/bin/activate
ezkl --help
python -c "import torch, onnx, ezkl; print('ok')"
```

## Benchmark outputs

- Write reports under `benchmarks/results/`
- Commit small `*.json`, `*.csv`, `*.md`, `*.svg`, `*.png`
- Keep large proofs/keys out of git (`*.proof`, `*.pk`, `*.vk`, `*.bin` are ignored)
- Oversized weights/proofs can live outside the repo: `~/projects/zyocra/` (parent of `Zyocra/`)

## Local-only vs published

| Path | Published to GitHub? |
|------|----------------------|
| `Zyocra/` source, docs, scripts, small benchmark reports | Yes |
| `Zyocra/.cursor/` | No (gitignored) |
| `Zyocra/model/.venv/` | No (gitignored) |
| Large artifacts under `~/projects/zyocra/` | No (outside repo) |

## Troubleshooting

**`make install` fails on missing tools**  
Install the missing host package from the sections above, open a new shell, re-run `make check-tools`.

**PyTorch wants CUDA**  
Re-run `make install`. The script forces the CPU wheel index:  
`https://download.pytorch.org/whl/cpu`

**`ezkl` command not found**  
Activate the venv: `source model/.venv/bin/activate`. The CLI is installed inside `model/.venv/bin/`.

**Foundry can't download solc**  
`forge` fetches solc versions itself on first build. Needs network once; no paid service.

**WSL memory pressure during pip install**  
Close other apps; PyTorch wheels are large but one-time. No Docker required.
