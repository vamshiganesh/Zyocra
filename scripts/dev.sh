#!/usr/bin/env bash
# dev.sh — start operator API + frontend dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

OPERATOR_PORT="${OPERATOR_PORT:-8787}"

cleanup() {
  kill "${OPERATOR_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [[ -f "$ROOT/frontend/package.json" ]]; then
  info "Starting operator API on port ${OPERATOR_PORT}"
  bash "$ROOT/scripts/operator.sh" &
  OPERATOR_PID=$!
  sleep 1

  info "Starting frontend dev server (pnpm dev)"
  cd "$ROOT/frontend"
  pnpm dev &
  FRONTEND_PID=$!

  wait
else
  info "frontend/ missing — starting operator only"
  exec bash "$ROOT/scripts/operator.sh"
fi
