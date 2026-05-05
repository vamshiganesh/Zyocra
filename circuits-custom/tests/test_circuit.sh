#!/usr/bin/env bash
# Fast circuit tests: compile + witness + logit_acc consistency.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PYTHON="${REPO}/ml-base/.venv/bin/python"

if ! command -v circom >/dev/null 2>&1; then
  echo "skip: circom not installed"
  exit 0
fi

export PYTHONPATH="$ROOT:${PYTHONPATH:-}"

bash "$ROOT/scripts/compile.sh"
bash "$ROOT/scripts/export_fixture.py"
bash "$ROOT/scripts/gen_witness.sh"

# wtns export: signal index 1 is main.logit_acc for this circuit layout.
WTNS_EXPORT="$(mktemp)"
npx snarkjs wtns export json "$ROOT/witnesses/witness.wtns" "$WTNS_EXPORT" >/dev/null
EXPECTED="$("$PYTHON" -c "import json; print(json.loads(open('$ROOT/fixtures/head-v1.json').read())['logit_acc'])")"
ACTUAL="$("$PYTHON" -c "import json; print(json.load(open('$WTNS_EXPORT'))[1])")"
rm -f "$WTNS_EXPORT"

if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "logit_acc mismatch: witness=$ACTUAL expected=$EXPECTED" >&2
  exit 1
fi

"$PYTHON" - <<PY
import json
from pathlib import Path
import numpy as np
from zyocra_circom.fixed_point import logit_accumulator

payload = json.loads(Path("$ROOT/fixtures/head-v1.json").read_text())
hidden = np.array(payload["hidden"], dtype=np.int32)
w = np.array(payload["weight_base"], dtype=np.int32)
a = np.array(payload["lora_a"], dtype=np.int32)
b = np.array(payload["lora_b"], dtype=np.int32).reshape(4, 8)
acc = logit_accumulator(hidden, w, a, b)
assert acc == payload["logit_acc"]
print(f"witness ok · logit_acc={acc}")
PY

echo "compile + witness: PASS"
