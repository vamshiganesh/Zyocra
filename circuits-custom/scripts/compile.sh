#!/usr/bin/env bash
# Compile lora_output_head.circom → build/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CIRCOM_DIR="$ROOT/circom"
BUILD_DIR="$ROOT/build"

mkdir -p "$BUILD_DIR"
cd "$CIRCOM_DIR"

echo "==> circom compile"
circom lora_output_head.circom --r1cs --wasm --sym -o "$BUILD_DIR"

if [[ -f "$BUILD_DIR/lora_output_head.r1cs" ]] && [[ -d "$ROOT/node_modules/snarkjs" ]]; then
  npx snarkjs r1cs info "$BUILD_DIR/lora_output_head.r1cs" 2>/dev/null | awk -F': ' '/Constraints/ {print "    total constraints:", $2}'
fi
