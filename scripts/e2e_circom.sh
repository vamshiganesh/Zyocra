#!/usr/bin/env bash
# Circom end-to-end: head prove → deploy Circom oracle → submit → consumer (local Anvil).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="${ROOT}/ml-base/.venv/bin/python"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
ANVIL_PORT="${ANVIL_PORT:-8545}"

info() { printf '==> %s\n' "$*"; }

info "[1/7] Circom LoRA head prove pipeline"
bash "${ROOT}/circuits-custom/scripts/run_pipeline.sh"

info "[2/7] Build Circom oracle payload"
(cd "${ROOT}/circuits-custom" && PYTHONPATH=. "${PYTHON}" -m zyocra_circom.oracle_payload)

info "[3/7] Build contracts"
(cd "${ROOT}/contracts" && forge build)

if ! curl -sf "${RPC_URL}" >/dev/null 2>&1; then
  info "[4/7] Start Anvil on port ${ANVIL_PORT}"
  anvil --port "${ANVIL_PORT}" --silent &
  ANVIL_PID=$!
  trap 'kill "${ANVIL_PID}" 2>/dev/null || true' EXIT
  sleep 1
else
  info "[4/7] Reuse Anvil at ${RPC_URL}"
fi

export DEPLOY_OUTFILE="${DEPLOY_OUTFILE:-anvil-circom-oracle-latest.json}"
info "[5/7] Deploy Circom oracle stack"
(cd "${ROOT}/contracts" && forge script script/DeployCircomOracle.s.sol:DeployCircomOracle \
  --rpc-url "${RPC_URL}" \
  --broadcast \
  --private-key "${PRIVATE_KEY}")

DEPLOY_JSON="${ROOT}/contracts/deployments/${DEPLOY_OUTFILE}"
if [[ ! -f "${DEPLOY_JSON}" ]]; then
  echo "deployment json missing: ${DEPLOY_JSON}" >&2
  exit 1
fi

ORACLE=$(python3 -c "import json; print(json.load(open('${DEPLOY_JSON}'))['oracle'])")
CONSUMER=$(python3 -c "import json; print(json.load(open('${DEPLOY_JSON}'))['consumer'])")

info "[6/7] Submit Circom proof + apply consumer policy"
export ORACLE_ADDRESS="${ORACLE}"
export CONSUMER_ADDRESS="${CONSUMER}"
(cd "${ROOT}/contracts" && forge script script/SubmitAndApplyCircom.s.sol:SubmitAndApplyCircom \
  --rpc-url "${RPC_URL}" \
  --broadcast \
  --private-key "${PRIVATE_KEY}")

LOOP_JSON="${ROOT}/contracts/deployments/circom-loop-latest.json"
info "[7/7] On-chain result"
python3 - <<PY
import json
from pathlib import Path

payload = json.loads(Path("${ROOT}/circuits-custom/proofs/oracle-payload.json").read_text())
loop = json.loads(Path("${LOOP_JSON}").read_text())
bucket = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"}[loop["bucket"]]
print(f"  scoreBps:        {loop['scoreBps']} (logit_acc {payload['logitAcc']})")
print(f"  epoch:           {loop['epoch']}")
print(f"  borrower:        {loop['borrower']}")
print(f"  bucket:          {bucket}")
print(f"  oracle:          ${ORACLE}")
print(f"  consumer:        ${CONSUMER}")
PY

bash "${ROOT}/scripts/sync-frontend-data.sh"
info "Circom oracle e2e complete"
