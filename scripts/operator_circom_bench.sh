#!/usr/bin/env bash
# Circom scope A: head prove + benchmark (not wired to RiskOracle).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

info() { printf '==> %s\n' "$*"; }

info "[1/2] Circom LoRA head prove pipeline"
bash "${ROOT}/circuits-custom/scripts/run_pipeline.sh"

info "[2/2] Benchmark harness (EZKL vs Circom head)"
make -C "${ROOT}" benchmark

bash "${ROOT}/scripts/sync-frontend-data.sh"
info "Circom benchmark path complete (head-only, not oracle e2e)"
