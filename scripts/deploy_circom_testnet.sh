#!/usr/bin/env bash
# deploy_circom_testnet.sh — deploy Circom oracle stack to Ethereum Sepolia.
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
PYTHON="${ROOT}/ml-base/.venv/bin/python"

info() { printf '==> %s\n' "$*"; }

if [[ -z "$RPC_URL" || -z "$PRIVATE_KEY" ]]; then
  echo "Set SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY in .env" >&2
  exit 1
fi

export RPC_URL PRIVATE_KEY
export DEPLOY_CHAIN=sepolia
export DEPLOY_OUTFILE=deployments/sepolia-circom-oracle-latest.json

if [[ "$SKIP_PROVE" != "1" ]]; then
  info "Circom LoRA head prove pipeline"
  bash "${ROOT}/circuits-custom/scripts/run_pipeline.sh"
  info "Build Circom oracle payload"
  (cd "${ROOT}/circuits-custom" && PYTHONPATH=. "${PYTHON}" -m zyocra_circom.oracle_payload)
else
  info "SKIP_PROVE=1 — using existing circuits-custom/proofs/"
fi

info "Build contracts"
(cd "${ROOT}/contracts" && forge build)

VERIFY_ARGS=()
if [[ -n "$ETHERSCAN_API_KEY" ]]; then
  VERIFY_ARGS=(--verify --etherscan-api-key "$ETHERSCAN_API_KEY")
else
  info "ETHERSCAN_API_KEY not set — broadcast without verification"
fi

info "Deploy Circom oracle stack to Sepolia"
(
  cd "${ROOT}/contracts"
  forge script script/DeployCircomOracle.s.sol:DeployCircomOracle \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY" \
    "${VERIFY_ARGS[@]}"
)

DEPLOY_JSON="${ROOT}/contracts/deployments/sepolia-circom-oracle-latest.json"
if [[ ! -f "$DEPLOY_JSON" ]]; then
  echo "deployment json missing: $DEPLOY_JSON" >&2
  exit 1
fi

info "Deployment written to $DEPLOY_JSON"
python3 - <<PY
import json
from pathlib import Path
d = json.loads(Path("$DEPLOY_JSON").read_text())
print("Oracle:         ", d.get("oracle"))
print("Consumer:       ", d.get("consumer"))
print("CircomVerifier: ", d.get("circomVerifier"))
print("Groth16:        ", d.get("groth16Verifier"))
print()
print("Next: bash scripts/submit_circom_testnet.sh")
print("Optional VITE (Circom oracle differs from EZKL):")
print("  VITE_ORACLE_ADDRESS=", d.get("oracle"), sep="")
print("  VITE_CONSUMER_ADDRESS=", d.get("consumer"), sep="")
PY
