#!/usr/bin/env bash
# submit_circom_testnet.sh — Circom submitScore + applyVerifiedScore on Sepolia.
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
PYTHON="${ROOT}/ml-base/.venv/bin/python"
DEPLOY_JSON="${ROOT}/contracts/deployments/sepolia-circom-oracle-latest.json"

info() { printf '==> %s\n' "$*"; }

if [[ -z "$RPC_URL" || -z "$PRIVATE_KEY" ]]; then
  echo "Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env" >&2
  exit 1
fi

if [[ ! -f "$DEPLOY_JSON" ]]; then
  echo "missing $DEPLOY_JSON — run bash scripts/deploy_circom_testnet.sh first" >&2
  exit 1
fi

ORACLE_ADDRESS="$(python3 -c "import json; print(json.load(open('$DEPLOY_JSON'))['oracle'])")"
CONSUMER_ADDRESS="$(python3 -c "import json; print(json.load(open('$DEPLOY_JSON'))['consumer'])")"

export RPC_URL PRIVATE_KEY ORACLE_ADDRESS CONSUMER_ADDRESS
export RESULT_OUTFILE=deployments/sepolia-circom-loop-latest.json

if [[ "$SKIP_PROVE" != "1" ]]; then
  info "Circom prove + oracle payload"
  bash "${ROOT}/circuits-custom/scripts/run_pipeline.sh"
  (cd "${ROOT}/circuits-custom" && PYTHONPATH=. "${PYTHON}" -m zyocra_circom.oracle_payload)
else
  info "SKIP_PROVE=1 — using existing circuits-custom/proofs/"
fi

info "Submit + apply Circom on Sepolia"
info "  oracle   $ORACLE_ADDRESS"
info "  consumer $CONSUMER_ADDRESS"

(
  cd "${ROOT}/contracts"
  forge script script/SubmitAndApplyCircom.s.sol:SubmitAndApplyCircom \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY"
)

LOOP_JSON="${ROOT}/contracts/deployments/sepolia-circom-loop-latest.json"
info "Result → $LOOP_JSON"
python3 - <<PY
import json
from pathlib import Path
d = json.loads(Path("$LOOP_JSON").read_text())
print("epoch:            ", d.get("epoch"))
print("scoreBps:         ", d.get("scoreBps"))
print("borrower:         ", d.get("borrower"))
print("collateralFactor: ", d.get("collateralFactorBps"))
PY
