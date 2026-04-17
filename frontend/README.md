# frontend

Dispatch-inspired product shell for Zyocra (Vite + React + TypeScript).

Static pages only—no backend or proof pipeline wiring.

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
  components/layout/   AppShell, TopNav, LeftRail, LogoMark
  components/ui/       Buttons, cards, stats, benchmark, FAQ, pricing
  pages/               Home, About, Updates, Blog
  styles/              tokens, global, layout
  data/placeholders.ts Zyocra-relevant static copy
```

Design tokens and usage: [`docs/design-system.md`](../docs/design-system.md).
