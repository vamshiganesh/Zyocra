#!/usr/bin/env bash
# lint.sh — lightweight local checks; expands as packages land.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }

status=0
ran=0

# Shell script syntax check for repo scripts
if command -v bash >/dev/null 2>&1; then
  info "Checking scripts/*.sh syntax (bash -n)"
  # bash -n: parse-only syntax check, does not execute
  for f in "$ROOT"/scripts/*.sh; do
    bash -n "$f" || status=1
  done
  ran=1
fi

if [[ -f "$ROOT/contracts/foundry.toml" ]]; then
  info "Formatting check: forge fmt --check"
  # forge fmt --check: fail if Solidity is not forge-formatted
  if (cd "$ROOT/contracts" && forge fmt --check); then
    ran=1
  else
    status=1
    ran=1
  fi
fi

if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Running frontend lint"
  if (cd "$ROOT/frontend" && pnpm lint); then
    ran=1
  else
    warn "frontend lint failed or is not defined"
    status=1
    ran=1
  fi
fi

VENV="$ROOT/model/.venv"
if [[ -x "$VENV/bin/python" ]]; then
  # Optional ruff if installed into the venv later
  if [[ -x "$VENV/bin/ruff" ]]; then
    info "Running ruff"
    "$VENV/bin/ruff" check "$ROOT/model" || status=1
    ran=1
  else
    info "Skipping Python lint (ruff not installed; optional)"
  fi
fi

if [[ "$ran" -eq 0 ]]; then
  warn "Nothing to lint yet."
  exit 0
fi

exit "$status"
