#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM="$ROOT/build/lora_output_head_js/lora_output_head.wasm"
GEN="$ROOT/build/lora_output_head_js/generate_witness.js"
INPUT="$ROOT/inputs/input.json"
OUT="$ROOT/witnesses/witness.wtns"

if [[ ! -f "$INPUT" ]]; then
  bash "$ROOT/scripts/export_fixture.py"
fi
if [[ ! -f "$WASM" ]]; then
  bash "$ROOT/scripts/compile.sh"
fi

mkdir -p "$ROOT/witnesses"
cd "$ROOT"

echo "==> generate witness"
node "$GEN" "$WASM" "$INPUT" "$OUT"
echo "    witness → $OUT"
