#!/usr/bin/env bash
# Groth16 setup: phase2 zkey for lora_output_head.r1cs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYS="$ROOT/keys"
BUILD="$ROOT/build"
R1CS="$BUILD/lora_output_head.r1cs"
PTAU="$KEYS/pot12_final.ptau"
ZKEY_0="$KEYS/circuit_0000.zkey"
ZKEY_FINAL="$KEYS/circuit_final.zkey"
VKEY="$KEYS/verification_key.json"

bash "$ROOT/scripts/setup_ptau.sh"

if [[ ! -f "$R1CS" ]]; then
  bash "$ROOT/scripts/compile.sh"
fi

mkdir -p "$KEYS"

if [[ ! -f "$ZKEY_FINAL" ]]; then
  echo "==> groth16 setup (phase2)"
  npx snarkjs groth16 setup "$R1CS" "$PTAU" "$ZKEY_0"
  npx snarkjs zkey contribute "$ZKEY_0" "$ZKEY_FINAL" \
    --name="zyocra-local" -v -e="zyocra-circom-$(date +%s)"
  rm -f "$ZKEY_0"
fi

echo "==> export verification key"
npx snarkjs zkey export verificationkey "$ZKEY_FINAL" "$VKEY"
echo "    zkey → $ZKEY_FINAL"
