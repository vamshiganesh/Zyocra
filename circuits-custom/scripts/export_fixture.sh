#!/usr/bin/env bash
# Export fixture + write inputs/input.json for witness calculator.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PYTHON="${REPO}/ml-base/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "missing venv — run: make install" >&2
  exit 1
fi

export PYTHONPATH="$ROOT:${PYTHONPATH:-}"
"$PYTHON" - <<'PY'
from pathlib import Path
import json

from zyocra_circom.config import DEMO_MANIFEST, FIXTURE_V1, INPUT_JSON, PUBLIC_JSON
from zyocra_circom.weights import export_fixture, write_input_json, write_public_json

payload = export_fixture(FIXTURE_V1)
write_input_json(payload, INPUT_JSON)
write_public_json(payload, PUBLIC_JSON)

DEMO_MANIFEST.parent.mkdir(parents=True, exist_ok=True)
DEMO_MANIFEST.write_text(
    json.dumps(
        {
            "circuit": "lora_output_head",
            "source": payload.get("source"),
            "logit_acc": payload["logit_acc"],
            "sample_index": payload.get("sample_index"),
            "fixture": str(FIXTURE_V1),
            "constraints": {"non_linear": 44, "total_r1cs": 89},
            "public_io": {"hidden_dim": 8, "lora_rank": 4},
        },
        indent=2,
        sort_keys=True,
    )
    + "\n",
    encoding="utf-8",
)

print(f"fixture → {FIXTURE_V1}")
print(f"input   → {INPUT_JSON}")
print(f"logit_acc = {payload['logit_acc']}")
PY
