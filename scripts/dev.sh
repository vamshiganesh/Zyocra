#!/usr/bin/env bash
# dev.sh — start local development processes that exist.
# Currently only the frontend when scaffolded; no cloud services.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }
warn() { printf '!!  %s\n' "$*" >&2; }

if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Starting frontend dev server (pnpm dev)"
  # pnpm dev: Vite/Next local HMR server — binds to localhost only by default
  cd "$ROOT/frontend"
  exec pnpm dev
fi

warn "frontend/ is not scaffolded yet — nothing to run for dev."
echo "When the UI lands, this script will run: (cd frontend && pnpm dev)"
echo "Optional local chain (after contracts exist): (cd contracts && anvil)"
exit 0
