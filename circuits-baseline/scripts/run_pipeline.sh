#!/usr/bin/env bash
# Full EZKL baseline pipeline (one-shot). Uses ml-base venv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PYTHON="${REPO}/ml-base/.venv/bin/python"
SCRIPTS="$ROOT/scripts"

if [[ ! -x "$PYTHON" ]]; then
  echo "missing venv at $PYTHON — run: make install (from repo root)" >&2
  exit 1
fi

echo "=== EZKL baseline pipeline (ezkl==23.0.5) ==="
"$PYTHON" "$SCRIPTS/gen_evm_verifier.py"
"$PYTHON" "$SCRIPTS/demo.py" --skip-setup --skip-compile --sample-index 0

echo "=== done ==="
