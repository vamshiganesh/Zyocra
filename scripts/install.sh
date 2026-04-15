#!/usr/bin/env bash
# install.sh — verify host toolchain and install phase-1 Python/ML deps.
# Does not scaffold frontend or contracts apps.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }

info "Zyocra phase-1 install (local-first, no cloud)"

# --- Host toolchain checks (install these on the OS if missing) ---
missing=0
check() {
  local name="$1"
  shift
  if have "$1"; then
    printf '  ok  %-10s %s\n' "$name" "$("$@" 2>/dev/null | head -1)"
  else
    printf '  miss %-10s (see docs/setup.md)\n' "$name"
    missing=1
  fi
}

info "Checking host tools"
check "node" node -v
check "pnpm" pnpm -v
check "python3" python3 --version
check "rustc" rustc --version
check "cargo" cargo --version
check "forge" forge --version
check "cast" cast --version
check "anvil" anvil --version
# Circom is optional for phase-1 baseline (EZKL is default); report only.
if have circom; then
  printf '  ok  %-10s %s\n' "circom" "$(circom --version 2>/dev/null | head -1)"
else
  printf '  skip %-10s (optional until Circom benchmark path)\n' "circom"
fi

if [[ "$missing" -ne 0 ]]; then
  warn "Missing required host tools. Install them using docs/setup.md, then re-run."
  exit 1
fi

# --- Python venv + ML / EZKL deps ---
VENV="$ROOT/model/.venv"
REQ="$ROOT/model/requirements.txt"

info "Creating Python venv at model/.venv (if needed)"
# python3 -m venv: create an isolated environment so system packages stay untouched
if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

info "Upgrading pip inside venv"
python -m pip install --upgrade pip

info "Installing CPU PyTorch wheel index (free, no CUDA/cloud required)"
# Official CPU wheels avoid pulling a huge CUDA stack on WSL laptops.
python -m pip install --index-url https://download.pytorch.org/whl/cpu torch

info "Installing remaining model requirements (onnx, onnxruntime, numpy, ezkl)"
python -m pip install -r "$REQ"

info "Verifying imports"
python - <<'PY'
import importlib
for mod in ("torch", "onnx", "onnxruntime", "numpy", "ezkl"):
    importlib.import_module(mod)
    print(f"  ok  {mod}")
PY

# ezkl pip package exposes a Python API (import ezkl), not a standalone CLI binary.
EZKL_VER="$(python -c 'import ezkl; print(getattr(ezkl, "__version__", "unknown"))' 2>/dev/null || echo unknown)"
printf '  ok  %-10s python API %s (import ezkl)\n' "ezkl" "$EZKL_VER"

# --- Frontend / contracts placeholders (no scaffold yet) ---
if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Installing frontend deps with pnpm"
  (cd "$ROOT/frontend" && pnpm install)
else
  info "Skipping frontend pnpm install (frontend/ not scaffolded yet)"
fi

if [[ -f "$ROOT/contracts/foundry.toml" ]]; then
  info "Installing Foundry deps"
  (cd "$ROOT/contracts" && forge install)
else
  info "Skipping forge install (contracts/ not scaffolded yet)"
fi

info "Ensuring benchmarks/results exists"
mkdir -p "$ROOT/benchmarks/results"

info "Install complete"
echo
echo "Activate the ML venv with:"
echo "  source model/.venv/bin/activate"
echo
echo "Next: see docs/setup.md for run commands (make dev / test / lint / benchmark)."
