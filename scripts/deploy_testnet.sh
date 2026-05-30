#!/usr/bin/env bash
# deploy_testnet.sh — deploy EZKL oracle stack to Ethereum Sepolia with Etherscan verify.
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
ETHERSCAN_API_KEY="${ETHERSCAN_API_KEY:-}"
SKIP_PROVE="${SKIP_PROVE:-0}"

if [[ -z "$RPC_URL" || -z "$PRIVATE_KEY" ]]; then
  echo "Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env" >&2
  exit 1
fi

export RPC_URL PRIVATE_KEY
export DEPLOY_CHAIN=sepolia
export DEPLOY_OUTFILE=deployments/sepolia-ezkl-latest.json

info() { printf '==> %s\n' "$*"; }

PYTHON="${ROOT}/ml-base/.venv/bin/python"

if [[ "$SKIP_PROVE" != "1" ]]; then
  if [[ -x "$PYTHON" ]]; then
    info "EZKL prove (sample row 0)"
    "$PYTHON" "${ROOT}/circuits-baseline/scripts/demo.py" --skip-setup --skip-compile --sample-index 0
    "$PYTHON" "${ROOT}/circuits-baseline/scripts/gen_evm_verifier.py"
    cp "${ROOT}/circuits-baseline/verifiers/RiskScoreVerifier.sol" "${ROOT}/contracts/src/verifiers/Halo2Verifier.sol"
  else
    info "Skipping prove (no venv) — using committed artifacts"
  fi
fi

info "Build contracts"
(cd "${ROOT}/contracts" && forge build)

VERIFY_ARGS=()
if [[ -n "$ETHERSCAN_API_KEY" ]]; then
  VERIFY_ARGS=(--verify --etherscan-api-key "$ETHERSCAN_API_KEY")
else
  info "ETHERSCAN_API_KEY not set — broadcast without verification"
fi

info "Deploy to Sepolia"
(
  cd "${ROOT}/contracts"
  forge script script/DeployEzkl.s.sol:DeployEzkl \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    "${VERIFY_ARGS[@]}"
)

DEPLOY_JSON="${ROOT}/contracts/deployments/sepolia-ezkl-latest.json"
if [[ ! -f "$DEPLOY_JSON" ]]; then
  echo "deployment json missing: $DEPLOY_JSON" >&2
  exit 1
fi

info "Deployment written to $DEPLOY_JSON"
python3 - <<PY
import json
from pathlib import Path
d = json.loads(Path("$DEPLOY_JSON").read_text())
print("Oracle:  ", d.get("oracle"))
print("Consumer:", d.get("consumer"))
PY

info "Update frontend .env with VITE_ORACLE_ADDRESS and VITE_CONSUMER_ADDRESS from the JSON above."
