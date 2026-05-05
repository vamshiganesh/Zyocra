#!/usr/bin/env bash
# Powers-of-tau file for Groth16 setup (pot12 suffices for ~44 constraints).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYS="$ROOT/keys"
PTAU="$KEYS/pot12_final.ptau"

mkdir -p "$KEYS"

if [[ -f "$PTAU" ]]; then
  echo "==> ptau present: $PTAU"
  exit 0
fi

echo "==> generating local pot12 (no trusted download required)"
cd "$KEYS"
npx snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
echo "zyocra-local-contribution" | npx snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau \
  --name="zyocra-local" -v
npx snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
rm -f pot12_0000.ptau pot12_0001.ptau
echo "    saved $PTAU"
