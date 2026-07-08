#!/usr/bin/env bash
# submit_testnet.sh — one-shot EZKL submitScore + applyVerifiedScore on Sepolia.
# Uses existing contracts/deployments/sepolia-ezkl-latest.json (does NOT redeploy).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

RPC_URL="${SEPOLIA_RPC_URL:-${RPC_URL:-}}"
PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:-${PRIVATE_KEY:-}}"
SKIP_PROVE="${SKIP_PROVE:-0}"
DEPLOY_JSON="${ROOT}/contracts/deployments/sepolia-ezkl-latest.json"

info() { printf '==> %s\n' "$*"; }

if [[ -z "$RPC_URL" || -z "$PRIVATE_KEY" ]]; then
  echo "Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env" >&2
  exit 1
fi

if [[ ! -f "$DEPLOY_JSON" ]]; then
  echo "missing $DEPLOY_JSON — run bash scripts/deploy_testnet.sh first" >&2
  exit 1
fi

ORACLE_ADDRESS="$(python3 -c "import json; print(json.load(open('$DEPLOY_JSON'))['oracle'])")"
CONSUMER_ADDRESS="$(python3 -c "import json; print(json.load(open('$DEPLOY_JSON'))['consumer'])")"

export RPC_URL PRIVATE_KEY ORACLE_ADDRESS CONSUMER_ADDRESS
export RESULT_OUTFILE=deployments/sepolia-loop-latest.json

PYTHON="${ROOT}/ml-base/.venv/bin/python"

if [[ "$SKIP_PROVE" != "1" ]]; then
  if [[ -x "$PYTHON" ]]; then
    info "EZKL prove (sample row 0) for Sepolia submit"
    "$PYTHON" "${ROOT}/circuits-baseline/scripts/demo.py" --skip-setup --skip-compile --sample-index 0
  else
    info "No ml-base venv — using committed proof artifacts"
  fi
else
  info "SKIP_PROVE=1 — using existing circuits-baseline/proofs/"
fi

info "Submit + apply on Sepolia"
info "  oracle   $ORACLE_ADDRESS"
info "  consumer $CONSUMER_ADDRESS"

(
  cd "${ROOT}/contracts"
  forge script script/SubmitAndApply.s.sol:SubmitAndApply \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY"
)

LOOP_JSON="${ROOT}/contracts/deployments/sepolia-loop-latest.json"
if [[ ! -f "$LOOP_JSON" ]]; then
  echo "result json missing: $LOOP_JSON" >&2
  exit 1
fi

info "Sepolia loop written to $LOOP_JSON"
python3 - <<PY
import json
from pathlib import Path
d = json.loads(Path("$LOOP_JSON").read_text())
print("epoch:            ", d.get("epoch"))
print("scoreBps:         ", d.get("scoreBps"))
print("borrower:         ", d.get("borrower"))
print("bucket:           ", d.get("bucket"))
print("collateralFactor: ", d.get("collateralFactorBps"))
print()
print("Frontend reads (already in .env if set):")
print("  VITE_ORACLE_ADDRESS=$ORACLE_ADDRESS")
print("  VITE_CONSUMER_ADDRESS=$CONSUMER_ADDRESS")
print("  VITE_RPC_URL=<your Sepolia RPC>")
print("Restart make dev, open Operator → Chain status — epoch should be > 0.")
PY
