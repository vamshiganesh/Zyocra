#!/usr/bin/env bash
# benchmark.sh — run EZKL vs Circom benchmark harness (Milestone 5).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

chmod +x "$ROOT/benchmarks/scripts/run.sh" 2>/dev/null || true
exec "$ROOT/benchmarks/scripts/run.sh" "$@"
