#!/usr/bin/env bash
# benchmark.sh — write a local benchmark summary under benchmarks/results/.
# Phase-1: environment snapshot + placeholders for prove/verify timings.
# Full EZKL/Circom benches land with prover packages.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

info() { printf '==> %s\n' "$*"; }

OUT_DIR="$ROOT/benchmarks/results"
mkdir -p "$OUT_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_JSON="$OUT_DIR/env-${STAMP}.json"
OUT_MD="$OUT_DIR/env-${STAMP}.md"

VENV="$ROOT/model/.venv"
EZKL_VER="not-installed"
TORCH_VER="not-installed"
if [[ -x "$VENV/bin/python" ]]; then
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  EZKL_VER="$(python -c 'import ezkl; print(getattr(ezkl, "__version__", "unknown"))' 2>/dev/null || echo unknown)"
  TORCH_VER="$(python -c 'import torch; print(torch.__version__)' 2>/dev/null || echo unknown)"
else
  :
fi

NODE_VER="$(node -v 2>/dev/null || echo missing)"
PNPM_VER="$(pnpm -v 2>/dev/null || echo missing)"
PYTHON_VER="$(python3 --version 2>/dev/null || echo missing)"
RUSTC_VER="$(rustc --version 2>/dev/null || echo missing)"
FORGE_VER="$(forge --version 2>/dev/null | head -1 || echo missing)"
CIRCOM_VER="$(circom --version 2>/dev/null | head -1 || echo missing)"

info "Writing benchmark environment snapshot"
# JSON is easy to chart later; MD is recruiter-readable in PRs.
cat >"$OUT_JSON" <<EOF
{
  "kind": "env_snapshot",
  "timestamp_utc": "$STAMP",
  "host": {
    "node": "$NODE_VER",
    "pnpm": "$PNPM_VER",
    "python": "$PYTHON_VER",
    "rustc": "$RUSTC_VER",
    "forge": "$FORGE_VER",
    "circom": "$CIRCOM_VER"
  },
  "python_packages": {
    "torch": "$TORCH_VER",
    "ezkl": "$EZKL_VER"
  },
  "ezkl_api": "python import ezkl",
  "benches": {
    "ezkl_prove_ms": null,
    "ezkl_verify_ms": null,
    "circom_prove_ms": null,
    "circom_verify_ms": null,
    "proof_size_bytes": null
  },
  "notes": "Timing fields fill in when prover packages and fixtures exist."
}
EOF

cat >"$OUT_MD" <<EOF
# Benchmark environment snapshot

- **UTC:** $STAMP
- **Node:** $NODE_VER
- **pnpm:** $PNPM_VER
- **Python:** $PYTHON_VER
- **Rustc:** $RUSTC_VER
- **Forge:** $FORGE_VER
- **Circom:** $CIRCOM_VER
- **Torch:** $TORCH_VER
- **EZKL (python API):** $EZKL_VER

## Pending timings

| Path | Prove (ms) | Verify (ms) | Proof size |
|------|------------|-------------|------------|
| EZKL baseline | — | — | — |
| Circom benchmark | — | — | — |

Commit small JSON/MD/SVG/PNG reports under \`benchmarks/results/\`. Keep large proofs out of git.
EOF

info "Wrote $OUT_JSON"
info "Wrote $OUT_MD"
echo "Commit these reports when you want history in the repo."
