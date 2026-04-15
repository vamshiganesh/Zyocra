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
  # forge test: compile and execute Solidity tests with local EVM (no RPC)
  if (cd "$ROOT/contracts" && forge test); then
    ran=1
  else
    status=1
    ran=1
  fi
else
  info "Skipping contracts tests (contracts/ not scaffolded yet)"
fi

VENV="$ROOT/model/.venv"
if [[ -x "$VENV/bin/python" ]]; then
  # Prefer pytest if present; otherwise a trivial import smoke check.
  if [[ -d "$ROOT/model/tests" ]] || compgen -G "$ROOT/model/**/test_*.py" >/dev/null 2>&1; then
    info "Running Python tests"
    # shellcheck disable=SC1091
    source "$VENV/bin/activate"
    if python -m pytest -q; then
      ran=1
    else
      status=1
      ran=1
    fi
  else
    info "Running Python import smoke check (no tests/ yet)"
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
  warn "model/.venv missing — run: make install"
  status=1
fi

if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Running frontend tests"
  if (cd "$ROOT/frontend" && pnpm test); then
    ran=1
  else
    # Frontend may not define a test script yet
    warn "frontend test script failed or is not defined"
    status=1
    ran=1
  fi
else
  info "Skipping frontend tests (frontend/ not scaffolded yet)"
fi

if [[ "$ran" -eq 0 ]]; then
  warn "No test suites found. Scaffold packages or run: make install"
  exit 1
fi

exit "$status"
