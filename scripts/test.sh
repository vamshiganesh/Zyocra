#!/usr/bin/env bash
# test.sh — run available test suites locally (Foundry, Python).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }

ran=0
status=0

if [[ -f "$ROOT/contracts/foundry.toml" ]]; then
  info "Running Foundry tests"
  if (cd "$ROOT/contracts" && forge test); then
    ran=1
  else
    status=1
    ran=1
  fi
else
  info "Skipping contracts tests (contracts/ not initialized yet)"
fi

VENV="$ROOT/ml-base/.venv"
if [[ -x "$VENV/bin/python" ]]; then
  if [[ -d "$ROOT/ml-base/tests" ]] || compgen -G "$ROOT/ml-base/**/test_*.py" >/dev/null 2>&1; then
    info "Running Python tests under ml-base/"
    # shellcheck disable=SC1091
    source "$VENV/bin/activate"
    if (cd "$ROOT/ml-base" && python -m pytest -q); then
      ran=1
    else
      status=1
      ran=1
    fi
  else
    info "Running Python import smoke check (no ml-base tests yet)"
    # shellcheck disable=SC1091
    source "$VENV/bin/activate"
    if python -c "import torch, onnx, onnxruntime, numpy, ezkl"; then
      ran=1
    else
      status=1
      ran=1
    fi
  fi
else
  warn "ml-base/.venv missing — run: make install"
  status=1
fi

if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Running frontend tests"
  if (cd "$ROOT/frontend" && pnpm test); then
    ran=1
  else
    warn "frontend test script failed or is not defined"
    status=1
    ran=1
  fi
else
  info "Skipping frontend tests (optional UI not present)"
fi

if [[ "$ran" -eq 0 ]]; then
  warn "No test suites found. Run: make install"
  exit 1
fi

exit "$status"
