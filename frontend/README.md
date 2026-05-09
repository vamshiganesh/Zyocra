# frontend

Dispatch-inspired product shell for Zyocra (Vite + React + TypeScript).

Pipeline screens read live JSON from `public/data/` (`phase1-demo.json`, `bench-latest.json`) when synced.

## Commands

```bash
# from repo root
make dev

# or
cd frontend
pnpm install
pnpm dev
pnpm build
pnpm test    # TypeScript check (tsc --noEmit)
pnpm lint
```

Sync demo data from repo root:

```bash
bash scripts/sync-frontend-data.sh   # after EZKL / e2e / benchmark
```

## Structure

```text
src/
  config/screens.ts       Route metadata and section anchors
  hooks/                  usePhase1Data, useBenchmarkData
  components/layout/      AppShell, TopNav, LeftRail, LogoMark
  components/product/     Hero, flow nav, data grids, DataStatus
  components/ui/          Buttons, cards, stats, benchmark panels
  pages/                  10 product screens (overview → changelog)
  data/                   content, placeholders, phase1-view
  styles/                 tokens (#eba50e accent), global, layout
```

Screen architecture: [`docs/screens.md`](../docs/screens.md).  
Product copy: [`docs/messaging.md`](../docs/messaging.md).  
Data binding: [`docs/frontend-data.md`](../docs/frontend-data.md).  
Design tokens: [`docs/design-system.md`](../docs/design-system.md).
