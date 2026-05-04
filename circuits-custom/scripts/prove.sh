#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZKEY="$ROOT/keys/circuit_final.zkey"
WITNESS="$ROOT/witnesses/witness.wtns"
PROOF="$ROOT/proofs/proof.json"
PUBLIC="$ROOT/proofs/public.json"

if [[ ! -f "$WITNESS" ]]; then
  bash "$ROOT/scripts/gen_witness.sh"
fi
if [[ ! -f "$ZKEY" ]]; then
  bash "$ROOT/scripts/setup_keys.sh"
fi

mkdir -p "$ROOT/proofs"
cd "$ROOT"

echo "==> groth16 prove"
npx snarkjs groth16 prove "$ZKEY" "$WITNESS" "$PROOF" "$PUBLIC"
echo "    proof → $PROOF"
