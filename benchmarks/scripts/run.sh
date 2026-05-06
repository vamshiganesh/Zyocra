#!/usr/bin/env bash
# Run the full EZKL vs Circom benchmark harness.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PYTHON="${REPO}/ml-base/.venv/bin/python"
RUNNER="$ROOT/zyocra_bench/runner.py"

if [[ ! -x "$PYTHON" ]]; then
  echo "missing ml-base venv — run: make install" >&2
  exit 1
fi

export PYTHONPATH="$ROOT:${PYTHONPATH:-}"
exec "$PYTHON" "$RUNNER" "$@"
