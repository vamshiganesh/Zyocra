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
PY="$VENV/bin/python"
if [[ -x "$PY" ]]; then
  if [[ -d "$ROOT/ml-base/tests" ]] || compgen -G "$ROOT/ml-base/**/test_*.py" >/dev/null 2>&1; then
    info "Running Python tests under ml-base/"
    if (cd "$ROOT/ml-base" && "$PY" -m pytest -q); then
      ran=1
    else
      status=1
      ran=1
    fi
  else
    info "Running Python import smoke check (no ml-base tests yet)"
    if "$PY" -c "import torch, onnx, onnxruntime, numpy, ezkl"; then
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

if [[ -d "$ROOT/circuits-custom/tests" ]] && command -v circom >/dev/null 2>&1; then
  info "Running circuits-custom tests"
  export PYTHONPATH="$ROOT/circuits-custom:${PYTHONPATH:-}"
  if [[ -x "$PY" ]] && [[ -f "$ROOT/circuits-custom/tests/test_fixed_point.py" ]]; then
    if (cd "$ROOT/circuits-custom" && "$PY" -m pytest tests/test_fixed_point.py -q); then
      :
    else
      status=1
    fi
  fi
  if bash "$ROOT/circuits-custom/tests/test_circuit.sh"; then
    :
  else
    status=1
  fi
  ran=1
elif [[ -d "$ROOT/circuits-custom/tests" ]]; then
  info "Skipping circuits-custom tests (circom not installed)"
fi

if [[ -d "$ROOT/benchmarks/tests" ]] && [[ -x "$PY" ]]; then
  info "Running benchmark harness unit tests"
  export PYTHONPATH="$ROOT/benchmarks:${PYTHONPATH:-}"
  if (cd "$ROOT/benchmarks" && "$PY" -m pytest tests/ -q); then
    ran=1
  else
    status=1
    ran=1
  fi
fi

if [[ "$ran" -eq 0 ]]; then
  warn "No test suites found. Run: make install"
  exit 1
fi

if [[ "$status" -eq 0 ]]; then
  info "All test suites passed"
else
  warn "One or more test suites failed (exit $status)"
fi

exit "$status"
