#!/usr/bin/env bash
# Phase 1 end-to-end: EZKL proof → deploy → oracle → consumer (local Anvil).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="${ROOT}/ml-base/.venv/bin/python"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
# Anvil default account #0
PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
ANVIL_PORT="${ANVIL_PORT:-8545}"

info() { printf '==> %s\n' "$*"; }

if [[ ! -x "$PYTHON" ]]; then
  echo "missing venv at $PYTHON — run: make install" >&2
  exit 1
fi

info "[1/8] EZKL inference + proof (deterministic sample row 0)"
"$PYTHON" "${ROOT}/circuits-baseline/scripts/demo.py" --skip-setup --skip-compile --sample-index 0

info "[2/8] Sync EZKL Solidity verifier into contracts/"
"$PYTHON" "${ROOT}/circuits-baseline/scripts/gen_evm_verifier.py"
cp "${ROOT}/circuits-baseline/verifiers/RiskScoreVerifier.sol" "${ROOT}/contracts/src/verifiers/Halo2Verifier.sol"

info "[3/8] Build contracts"
(cd "${ROOT}/contracts" && forge build)

if ! curl -sf "${RPC_URL}" >/dev/null 2>&1; then
  info "[4/8] Start Anvil on port ${ANVIL_PORT}"
  anvil --port "${ANVIL_PORT}" --silent &
  ANVIL_PID=$!
  trap 'kill "${ANVIL_PID}" 2>/dev/null || true' EXIT
  sleep 1
else
  info "[4/8] Reuse Anvil at ${RPC_URL}"
fi

info "[5/8] Deploy EZKL oracle stack"
(cd "${ROOT}/contracts" && forge script script/DeployEzkl.s.sol:DeployEzkl \
  --rpc-url "${RPC_URL}" \
  --broadcast \
  --private-key "${PRIVATE_KEY}")

DEPLOY_JSON="${ROOT}/contracts/deployments/anvil-ezkl-latest.json"
if [[ ! -f "${DEPLOY_JSON}" ]]; then
  echo "deployment json missing: ${DEPLOY_JSON}" >&2
  exit 1
fi

if [[ ! -f "${DEPLOY_JSON}" ]] || ! python3 -c "import json; d=json.load(open('${DEPLOY_JSON}')); assert 'oracle' in d" 2>/dev/null; then
  BROADCAST="${ROOT}/contracts/broadcast/DeployEzkl.s.sol/31337/run-latest.json"
  python3 - <<PY
import json
from pathlib import Path
b = json.loads(Path("${BROADCAST}").read_text())
txs = [t for t in b["transactions"] if t.get("transactionType") == "CREATE"]
addrs = [t["contractAddress"] for t in txs]
out = {
    "halo2Verifier": addrs[0],
    "ezklVerifier": addrs[1],
    "oracle": addrs[2],
    "consumer": addrs[3],
}
Path("${DEPLOY_JSON}").write_text(json.dumps(out, indent=2) + "\n")
print(json.dumps(out, indent=2))
PY
fi

ORACLE=$(python3 -c "import json; print(json.load(open('${DEPLOY_JSON}'))['oracle'])")
CONSUMER=$(python3 -c "import json; print(json.load(open('${DEPLOY_JSON}'))['consumer'])")

info "[6/8] Submit proof + apply consumer policy"
export ORACLE_ADDRESS="${ORACLE}"
export CONSUMER_ADDRESS="${CONSUMER}"
(cd "${ROOT}/contracts" && forge script script/SubmitAndApply.s.sol:SubmitAndApply \
  --rpc-url "${RPC_URL}" \
  --broadcast \
  --private-key "${PRIVATE_KEY}")

LOOP_JSON="${ROOT}/contracts/deployments/phase1-loop-latest.json"
info "[7/8] On-chain result"
python3 - <<PY
import json
from pathlib import Path

payload = json.loads(Path("${ROOT}/circuits-baseline/proofs/oracle-payload.json").read_text())
loop = json.loads(Path("${LOOP_JSON}").read_text())
bucket = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"}[loop["bucket"]]
print(f"  scoreBps:        {loop['scoreBps']} (witness float {payload['scoreFloat']})")
print(f"  epoch:           {loop['epoch']}")
print(f"  borrower:        {loop['borrower']}")
print(f"  bucket:          {bucket}")
print(f"  collateral bps:  {loop['collateralFactorBps']}")
print(f"  borrow spread:   {loop['borrowSpreadBps']}")
print(f"  borrow allowed:  {loop['borrowAllowed']}")
print(f"  oracle:          ${ORACLE}")
print(f"  consumer:        ${CONSUMER}")
PY

info "[8/8] Phase 1 loop complete"
echo "Events emitted: ScoreVerified, CollateralParamsUpdated, RiskBucketChanged (frontend-ready)"
echo "Artifacts: ${LOOP_JSON}"
