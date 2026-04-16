#!/usr/bin/env bash
# lint.sh — lightweight local checks; expands as packages land.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }

status=0
ran=0

if command -v bash >/dev/null 2>&1; then
  info "Checking scripts/*.sh syntax (bash -n)"
  for f in "$ROOT"/scripts/*.sh; do
    bash -n "$f" || status=1
  done
  if compgen -G "$ROOT/benchmarks/scripts/*.{sh,py}" >/dev/null 2>&1; then
    for f in "$ROOT"/benchmarks/scripts/*.{sh,py}; do
      [[ -f "$f" ]] || continue
      case "$f" in
        *.sh) bash -n "$f" || status=1 ;;
      esac
    done
  fi
  ran=1
fi

if [[ -f "$ROOT/contracts/foundry.toml" ]]; then
  info "Formatting check: forge fmt --check"
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

VENV="$ROOT/ml-base/.venv"
if [[ -x "$VENV/bin/python" ]]; then
  if [[ -x "$VENV/bin/ruff" ]]; then
    info "Running ruff on ml-base/"
    "$VENV/bin/ruff" check "$ROOT/ml-base" || status=1
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
