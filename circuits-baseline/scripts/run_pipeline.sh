#!/usr/bin/env bash
# Full EZKL baseline pipeline (one-shot). Uses ml-base venv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PYTHON="${REPO}/ml-base/.venv/bin/python"
SCRIPTS="$ROOT/scripts"

if [[ ! -x "$PYTHON" ]]; then
  echo "missing venv at $PYTHON — run: make install (from repo root)" >&2
  exit 1
fi

echo "=== EZKL baseline pipeline (ezkl==23.0.5) ==="
"$PYTHON" "$SCRIPTS/prepare_onnx.py"
"$PYTHON" "$SCRIPTS/gen_settings.py" --skip-prepare
"$PYTHON" "$SCRIPTS/compile_circuit.py"
"$PYTHON" "$SCRIPTS/setup.py"
"$PYTHON" "$SCRIPTS/gen_input.py"
"$PYTHON" "$SCRIPTS/gen_witness.py"
"$PYTHON" "$SCRIPTS/prove.py"
"$PYTHON" "$SCRIPTS/verify.py"
"$PYTHON" "$SCRIPTS/gen_evm_verifier.py"
"$PYTHON" -c "
import sys
from pathlib import Path
sys.path.insert(0, '${ROOT}')
from zyocra_ezkl.oracle_payload import write_oracle_payload
from zyocra_ezkl.pipeline import read_score_from_witness, write_demo_manifest
from zyocra_ezkl.config import DEMO_MANIFEST, WITNESS_JSON, ORACLE_PAYLOAD_JSON, SAMPLE_INPUT
import json
score = read_score_from_witness()
path = write_oracle_payload(score_float=score)
write_demo_manifest({
    'sample_index': 0,
    'score_float': score,
    'verify_passed': True,
    'artifacts': {
        'input': str(SAMPLE_INPUT),
        'witness': str(WITNESS_JSON),
        'proof': str(ORACLE_PAYLOAD_JSON.parent / 'proof.json'),
        'oracle_payload': str(path),
    },
}, DEMO_MANIFEST)
print(f'oracle payload → {path}')
"

echo "=== done ==="
