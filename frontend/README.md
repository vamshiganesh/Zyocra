# frontend

Dispatch-inspired product shell for Zyocra (Vite + React + TypeScript).

Static product screens—no backend or proof pipeline wiring yet.

## Commands

```bash
# from repo root
make dev

# or
cd frontend
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## Structure

```text
src/
  config/screens.ts    Route metadata and section anchors
  components/layout/   AppShell, TopNav, LeftRail, LogoMark
  components/product/  Hero, flow nav, data grids, epoch table
  components/ui/       Buttons, cards, stats, benchmark panels
  pages/               10 product screens (overview → changelog)
  data/                placeholders.ts, product-placeholders.ts
  styles/              tokens, global, layout, scrollbar
```

Screen architecture: [`docs/screens.md`](../docs/screens.md).  
Product copy: [`docs/messaging.md`](../docs/messaging.md).  
Design tokens: [`docs/design-system.md`](../docs/design-system.md).
