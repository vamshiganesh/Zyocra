# Frontend data binding (Phase 1)

The dashboard reads a single JSON snapshot produced by the EZKL pipeline and optional Anvil E2E loop. No wallet or RPC connection is required for the default demo.

## Data flow

```
circuits-baseline/logs/demo-latest.json
circuits-baseline/proofs/oracle-payload.json
contracts/deployments/anvil-ezkl-latest.json   (optional)
contracts/deployments/phase1-loop-latest.json  (optional, after submit)
        │
        ▼
scripts/sync-frontend-data.sh
        │
        ▼
frontend/public/data/phase1-demo.json
        │
        ▼
Phase1DataProvider → buildPhase1View() → pipeline pages
```

## Refreshing demo data

After proving, deploying, or running the full loop:

```bash
# From repo root (Zyocra/)
bash scripts/sync-frontend-data.sh

# Or run the full E2E (sync runs at the end)
bash scripts/e2e_phase1.sh
```

The dev server serves `phase1-demo.json` from `public/data/`. Reload the app or click **Retry** on the status banner if the file changed while the tab was open.

## Fields surfaced in the UI

| Area | Source |
|------|--------|
| Latest epoch | `epoch.id` / `epoch.numeric` |
| Model / adapter hash | `commitments.*` |
| Feature vector | `features.names` + `features.values` |
| Risk score & bucket | `score.float`, `score.bps`, `score.bucket` |
| Proof status | `proof.status`, `proof.offChainVerify`, `proof.lengthBytes` |
| Verification | `verification.onChain`, `verification.result`, contract addresses |
| Collateral factor / spread | `consumer.collateralFactorBps`, `consumer.borrowSpreadBps` |
| Headline metrics (Overview) | Derived in `buildPhase1View()` |

When `hasOnChain` is `true`, epoch registry status, verifier labels, and audit trail reflect Anvil submission from `phase1-loop-latest.json`.

## Frontend modules

| Path | Role |
|------|------|
| `frontend/src/types/phase1.ts` | Raw JSON schema |
| `frontend/src/data/phase1-view.ts` | Maps JSON → `DataField` grids and metrics |
| `frontend/src/hooks/usePhase1Data.ts` | Fetch, loading / empty / error states |
| `frontend/src/data/use-pipeline-fields.ts` | Live fields with static fallbacks |
| `frontend/src/components/product/DataStatus.tsx` | Non-blocking status banner |
| `frontend/src/components/product/BenchmarkPlaceholderPanel.tsx` | Milestone 5 benchmark slot |

## Empty and fallback behavior

- **`hasArtifacts: false`** — Pages show static placeholders from `product-placeholders.ts` plus an empty-state banner.
- **`hasArtifacts: true`, `hasOnChain: false`** — EZKL proof and scores are live; verifier submission shows as off-chain / ready.
- **Load error** — Banner with retry; static placeholders remain visible.

## Benchmark panel

Overview and Benchmarks include a frozen comparison table (`benchmarkRows` placeholders). Set `benchmark.populated: true` in the sync script when Milestone 5 results are checked in.

## Optional: live RPC reads

Phase 1 uses JSON only. To add contract reads later, set `VITE_RPC_URL` and extend `usePhase1Data` to merge viem `readContract` results over the JSON baseline.
