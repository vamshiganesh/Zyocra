#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
bash "$ROOT/scripts/export_fixture.py"
bash "$ROOT/scripts/compile.sh"
bash "$ROOT/scripts/setup_keys.sh"
bash "$ROOT/scripts/gen_witness.sh"
bash "$ROOT/scripts/prove.sh"
bash "$ROOT/scripts/verify.sh"
bash "$ROOT/scripts/export_verifier.sh"
echo "=== circom pipeline complete ==="
