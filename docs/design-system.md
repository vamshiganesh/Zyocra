# Design system

Dispatch-inspired industrial product shell for Zyocra. Orange from the reference is replaced with a **premium, muted technical yellow**.

Implementation lives in `frontend/src/styles/tokens.css` and reusable components under `frontend/src/components/`.

## Accent usage

| Token | Value | Use |
|-------|-------|-----|
| `--color-accent` | `#C9A84C` | Logo block, primary CTAs, active metric emphasis, FAQ/changelog tags, footer brand band, value numbers |
| `--color-accent-hover` | `#D4B45C` | Hover on accent controls |
| `--color-accent-pressed` | `#B3963F` | Pressed state |
| `--color-accent-ink` | `#141414` | Text/icons on accent surfaces |
| `--color-accent-soft` | `rgba(201, 168, 76, 0.14)` | Soft highlight fills (reserved) |

**Rules**

- Accent is scarce: logo, primary buttons, selective stat emphasis, small tags, footer band.
- Do not use neon yellow (`#FFD000`) or playful brights.
- Do not introduce a second brand accent.

## Surface colors

| Token | Value | Role |
|-------|-------|------|
| `--color-canvas` | `#121212` | Page background |
| `--color-canvas-elevated` | `#1A1A1A` | Dark inset panels |
| `--color-rail` | `#141414` | Left rail / logo cell |
| `--color-surface` | `#EBE6DA` | Primary beige content cards |
| `--color-surface-muted` | `#E0DACB` | Nested rows, table headers |
| `--color-surface-deep` | `#D4CEBF` | Avatars / deep beige |

Text on dark: `--color-fog` / `--color-fog-muted` / `--color-fog-faint`  
Text on light: `--color-ink` / `--color-ink-muted` / `--color-ink-faint`

## Spacing scale

4px base (`0.25rem` steps):

| Token | Rem | Px |
|-------|-----|----|
| `--space-1` | 0.25 | 4 |
| `--space-2` | 0.5 | 8 |
| `--space-3` | 0.75 | 12 |
| `--space-4` | 1 | 16 |
| `--space-5` | 1.25 | 20 |
| `--space-6` | 1.5 | 24 |
| `--space-8` | 2 | 32 |
| `--space-10` | 2.5 | 40 |
| `--space-12` | 3 | 48 |
| `--space-16` | 4 | 64 |
| `--space-20` | 5 | 80 |
| `--space-24` | 6 | 96 |

Page padding defaults to `--space-10` / `--space-8`. Section stacks use `--space-6`–`--space-12`. Prefer high whitespace over dense marketing blocks.

## Typography scale

| Token | Size | Typical use |
|-------|------|-------------|
| `--text-xs` | 11px | Mono labels, table meta |
| `--text-sm` | 13px | Body on cards, nav |
| `--text-md` | 15px | Default body |
| `--text-lg` | 18px | Card titles |
| `--text-xl` | 24px | Subheads |
| `--text-2xl` | 32px | Section titles (min) |
| `--text-3xl` | 44px | Large section titles |
| `--text-4xl` | 56px | Hero / brand |

**Families**

- `--font-sans`: DM Sans — UI, section titles, buttons
- `--font-serif`: Instrument Serif — hero headlines, stat values, brand wordmark
- `--font-mono`: JetBrains Mono — indexes, labels, table metrics, tags

Labels use uppercase + `--tracking-label` (0.06em) via `.mono-label`.

## Border treatment

- Dark canvas lines: `--color-line-dark` (`rgba(232, 227, 213, 0.12)`)
- Light panel lines: `--color-line-light` (`rgba(20, 20, 20, 0.12)`)
- Hairline `1px` grids between stats, pricing columns, team cells
- Hatched dividers: `.hatch` / `.hatch-dark` (45° repeating lines)
- Dot grids: `.dot-grid` on illustration frames

## Corner geometry

Cards and framed panels use **45° chamfers on all four corners** — never `border-radius` rounding.

| Token | Value | Use |
|-------|-------|-----|
| `--clip-sm` | `10px` | Small clips |
| `--clip-md` | `14px` | Buttons, logo (single-corner chamfer) |
| `--clip-lg` | `16px` | Cards — all four corners |

**Card pattern** (`ClippedCard`):

- Outer/inner `clip-path` octagon so each corner is cut at 45°
- 1px border follows the chamfer (border ring layer + fill layer)
- Optional L-shaped **corner brackets** outside the panel (crop-mark style)

**Buttons** (`ClippedButton`):

- Diagonal chamfer: **top-left + bottom-right** cut at 45°; top-right and bottom-left stay square
- Flat fill (beige / accent / ink); no heavy border or shadow
- **Hover:** vertical text roll — label translates up one line; exiting line skews (`skewY(-10deg)`), entering line settles from `skewY(10deg)` to flat (Dispatch-style slot roll)
- Respects `prefers-reduced-motion`

**Logo / footer band:**

- Logo cell and footer brand band may use a single-corner chamfer on brand chrome

Do **not** use rounded rectangles for content cards or buttons.

## Layout primitives

| Primitive | Role |
|-----------|------|
| `AppShell` | Logo cell, top nav, left rail, main outlet |
| `TopNav` | Home / About / Updates / Blog + Get Started |
| `LeftRail` | Numbered section anchors per page |
| `SectionHeader` | Hatch bar + label + title + side description |
| `ClippedButton` | Accent / surface / ink / ghost |
| `ClippedCard` | Beige (or dark) content panel |
| `StatTile` | Metric cell; optional accent value |
| `BenchmarkPanel` | EZKL vs Circom table shell |
| `FaqAccordion` | Expand/collapse FAQ |
| `PricingTable` | Three-plan comparison shell |
| `GeoFrame` | Line-art geometric illustration frame |

## Canvas & sections

No full-page blueprint grid. Use solid dark tones with **slight section shifts**:

| Token | Role |
|-------|------|
| `--color-canvas` (`#111`) | Hero / base |
| `--color-canvas-2` (`#161616`) | Panel band, top nav |
| `--color-canvas-3` (`#1b1b1b`) | Footer upper |
| `#0a0a0a` | Legal bar |

Structural **horizontal and vertical hairlines** (`--color-line-dark`) separate logo, rail, nav, bands, and footer columns.

## Shell layout

Wide **centered** shell (`max-width: 92rem`, `margin-inline: auto`) with hairline left/right edges. Equal empty canvas on both sides when the viewport is wider. Sticky logo / top nav / left rail. **Document scroll** — scrollbar on the browser’s right edge. Content fills the shell’s main column (not a second, narrower card inside).

## Do / don’t

**Do:** keep accent rare; preserve beige-on-dark; use mono labels with dots; leave generous hero whitespace.

**Don’t:** neon yellow; heavy drop shadows; dense card clutter; connect backend data in this shell phase.
