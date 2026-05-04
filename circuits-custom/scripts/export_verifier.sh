#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZKEY="$ROOT/keys/circuit_final.zkey"
OUT="$ROOT/verifiers/LoraHeadVerifier.sol"

if [[ ! -f "$ZKEY" ]]; then
  bash "$ROOT/scripts/setup_keys.sh"
fi

mkdir -p "$ROOT/verifiers"
echo "==> export Solidity verifier"
npx snarkjs zkey export solidityverifier "$ZKEY" "$OUT"
echo "    verifier → $OUT"
