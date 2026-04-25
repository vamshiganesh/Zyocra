#!/usr/bin/env bash
# run_pipeline.sh — Phase 1 ML pipeline (local, deterministic).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PY="${PY:-python3}"
if [[ -x "$ROOT/.venv/bin/python" ]]; then
  PY="$ROOT/.venv/bin/python"
fi

info() { printf '==> %s\n' "$*"; }

info "prepare_dataset"
"$PY" scripts/prepare_dataset.py

info "engineer_features"
"$PY" scripts/engineer_features.py

info "train"
"$PY" scripts/train.py

info "evaluate"
"$PY" scripts/evaluate.py

info "export_onnx"
"$PY" scripts/export_onnx.py

info "pipeline complete — artifacts under ml-base/artifacts/"
