#!/usr/bin/env bash
# install.sh — verify host toolchain and install ML/EZKL deps into ml-base/.venv.
# Does not implement Milestone 1–5 application code.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }

info "Zyocra install (local-first, no cloud)"

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
if have circom; then
  printf '  ok  %-10s %s\n' "circom" "$(circom --version 2>/dev/null | head -1)"
else
  printf '  skip %-10s (needed for Milestone 3 — circuits-custom)\n' "circom"
fi

if [[ "$missing" -ne 0 ]]; then
  warn "Missing required host tools. Install them using docs/setup.md, then re-run."
  exit 1
fi

VENV="$ROOT/ml-base/.venv"
REQ="$ROOT/ml-base/requirements.txt"
PYTHON="$VENV/bin/python"

info "Creating Python venv at ml-base/.venv (if needed)"
if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
fi

if [[ ! -x "$PYTHON" ]]; then
  warn "venv python missing at $PYTHON"
  exit 1
fi

info "Upgrading pip inside venv"
"$PYTHON" -m pip install --upgrade pip

info "Installing CPU PyTorch (free, no CUDA/cloud required)"
"$PYTHON" -m pip install --index-url https://download.pytorch.org/whl/cpu torch

info "Installing ml-base requirements (onnx, onnxruntime, numpy, ezkl)"
"$PYTHON" -m pip install -r "$REQ"

info "Verifying imports"
"$PYTHON" - <<'PY'
import importlib
for mod in ("torch", "onnx", "onnxruntime", "numpy", "ezkl"):
    importlib.import_module(mod)
    print(f"  ok  {mod}")
PY

EZKL_VER="$("$PYTHON" -c 'import ezkl; print(getattr(ezkl, "__version__", "unknown"))' 2>/dev/null || echo unknown)"
printf '  ok  %-10s python API %s (import ezkl)\n' "ezkl" "$EZKL_VER"

if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Installing frontend deps with pnpm"
  (cd "$ROOT/frontend" && pnpm install)
else
  info "Skipping frontend pnpm install (optional UI not present)"
fi

if [[ -f "$ROOT/contracts/foundry.toml" ]]; then
  info "Installing Foundry deps"
  (cd "$ROOT/contracts" && forge install)
else
  info "Skipping forge install (contracts/ not initialized yet)"
fi

if [[ -f "$ROOT/circuits-custom/package.json" ]]; then
  info "Installing circuits-custom npm deps (snarkjs)"
  (cd "$ROOT/circuits-custom" && npm install --silent 2>/dev/null || npm install)
fi
mkdir -p "$ROOT/benchmarks/raw-results" "$ROOT/benchmarks/plots"

info "Install complete"
echo
echo "Activate the ML venv with:"
echo "  source ml-base/.venv/bin/activate"
echo
echo "Next: docs/setup.md and docs/roadmap.md"
