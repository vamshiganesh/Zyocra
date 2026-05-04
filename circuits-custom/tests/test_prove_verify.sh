#!/usr/bin/env bash
# Full Groth16 prove + verify (requires network once for ptau download).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v circom >/dev/null 2>&1; then
  echo "skip: circom not installed"
  exit 0
fi

bash "$ROOT/tests/test_circuit.sh"
bash "$ROOT/scripts/setup_keys.sh"
bash "$ROOT/scripts/prove.sh"
bash "$ROOT/scripts/verify.sh"

if [[ ! -f "$ROOT/verifiers/LoraHeadVerifier.sol" ]]; then
  bash "$ROOT/scripts/export_verifier.sh"
fi

test -f "$ROOT/proofs/proof.json"
test -f "$ROOT/verifiers/LoraHeadVerifier.sol"
echo "prove + verify + verifier export: PASS"
