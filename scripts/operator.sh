#!/usr/bin/env bash
# operator.sh — start FastAPI operator service.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

PORT="${OPERATOR_PORT:-8787}"
VENV="${ROOT}/operator/.venv"

if [[ ! -d "$VENV" ]]; then
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q -r "${ROOT}/operator/requirements.txt"
fi

export PYTHONPATH="${ROOT}/operator${PYTHONPATH:+:$PYTHONPATH}"
exec "$VENV/bin/uvicorn" app.main:app --app-dir "${ROOT}/operator" --host 0.0.0.0 --port "$PORT" --reload
