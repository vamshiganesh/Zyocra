#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VKEY="$ROOT/keys/verification_key.json"
PUBLIC="$ROOT/proofs/public.json"
PROOF="$ROOT/proofs/proof.json"

if [[ ! -f "$PROOF" ]]; then
  bash "$ROOT/scripts/prove.sh"
fi

echo "==> groth16 verify"
npx snarkjs groth16 verify "$VKEY" "$PUBLIC" "$PROOF"
echo "    OK — proof verified"
