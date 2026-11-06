# Design System — Jigi

**Created:** 2026-06-27 via `/design-consultation`  
**Status:** Source of truth for UI rebuild and polish  
**Revised:** 2026-10-13 — Orchid/Sage palette, Krona One display, Radix Themes. Live library: `/app/design-system` (admins; also `/dev/design-system` in dev).

## Product Context

- **What this is:** Brand–agency creative workflow platform — AI generation (concepts, copy, images) with in-app human review and approval.
- **Who it's for:** Agency creators, brand approvers, and admins coordinating campaign creative from brief to approved asset.
- **Space/industry:** Creative approval / brand governance (peers: Filestage, Approval Studio, StreamWork, Planable).
- **Project type:** B2B web app (dashboard + review workspace) with marketing landing.

**Memorable thing:** *Approved creative, on your brand's terms — fast, visible, in one place.*

Every design decision should reinforce clarity (what needs my action?), trust (audit trail, status), and speed (fewer clicks from generate → approve).

## Aesthetic Direction

- **Direction:** **Refined utilitarian** — warm editorial surfaces for brand/campaign context; dense, calm utility for generation and review.
- **Decoration level:** **Intentional** — soft paper grounds, subtle borders/shadows; no gradient heroes or decorative blobs.
- **Mood:** Professional but human. Feels like a creative studio's internal tool, not generic SaaS. Soft paper, sharp hierarchy, Orchid as the decisive action colour and Sage as the colour of “approved”.
- **Reference patterns:** Category leaders use neutral shells + strong asset preview + status chips (Filestage, Frame.io). Jigi differentiates with **brand-grounded generation** and **dual journey** (brand-first vs idea-first) visible in UI semantics.

### Safe choices (category baseline)

- Neutral app shell (sidebar + header + content) — users expect this for workflow tools.
- Semantic status colors for review states (draft, submitted, approved, rejected, changes requested).
- Card-based campaign and asset lists with clear primary actions.

### Creative risks (where Jigi gets its face)

1. **Wide display face for titles only** — Krona One on page, campaign and marketing headers gives Jigi a recognisable face without harming data density in tables and review UI.
2. **Asset-first review layout** — Review screen treats the creative as the hero (≥60% viewport), metadata and actions in a fixed sidebar; mimics proofing tools, not admin CRUD.
3. **Journey semantics in colour** — Orchid marks *brand-first*, Clay marks *idea-first*; Honey means *waiting on someone*. Users learn the product's two modes visually.

## Typography

- **Display / page titles:** **Krona One** (400 only) — page titles, campaign titles, landing hero, empty-state headlines. Use `PageTitle` / `DisplayTitle` from `@/design-system`.
  - Single weight and very wide: **≥20px only**, never bold (no `font-semibold` with `font-display` — a test enforces this), never in tables, buttons, labels or section headers.
  - Tracking `-0.02em`, balanced wrapping; page titles clamp to two lines.
- **Body / UI:** **Source Sans 3** (400–600) — everything you read or click, including section headers (`SectionTitle`).
- **Data / tables:** Source Sans 3 with `tabular-nums` on metrics and counts.
- **Code / prompts:** **Geist Mono** — generation logs, prompt fields, hex values.
- **Loading:** Google Fonts in `index.html` — `Krona One`, `Source Sans 3`, `Geist Mono`. Fraunces is retired.
- Tailwind: `font-display`, `font-sans`, `font-mono`. `font-serif` is retired in app code (a test enforces this); the dark marketing landing keeps its own Playfair theme for now.

### Type scale

Source: `TYPE_SCALE` in `src/design-system/tokens.ts`.

| Token | Size | Font | Use |
|-------|------|------|-----|
| `text-display` | 2.25rem / 36px | Krona One 400 | Landing hero, campaign title |
| `text-h1` | 1.5rem / 24px | Krona One 400 | Page titles |
| `text-h2` | 1.125rem / 18px | Source Sans 600 | Section headers |
| `text-body` | 0.875rem / 14px | Source Sans 400 | Default body |
| `text-small` | 0.75rem / 12px | Source Sans 500 | Meta, timestamps, badges |
| `text-label` | 0.6875rem / 11px | Source Sans 600 uppercase | Form labels, table headers (`Eyebrow`) |

## Color

- **Approach:** **Two-primary, meaning-first** — Orchid acts, Sage approves; nine secondaries each carry one meaning; mauve-tinted neutrals carry most of the UI.
- **Source of truth:** `src/design-system/tokens.ts` → `pnpm theme:build` → `src/styles/jigi-theme.css`. Never hand-edit the CSS.
- **Contrast:** every text/background pairing is tested to WCAG AA (4.5:1; 3:1 for UI strokes) in light and dark mode.

### Primary (12-step scales, Radix convention)

The supplied brand hex is **step 8** of each scale. Neither carries white text on its own, so solid fills use **step 9**.

| Name | Brand hex | Solid (step 9) | Radix palette replaced | Use |
|------|-----------|----------------|------------------------|-----|
| **Orchid** | `#A47DAB` | `#835D8A` (5.4:1 on white) | `iris` (the accent) | Primary actions, active nav, focus rings, links, brand-first journey |
| **Sage** | `#84AB7D` | `#54794D` (5.0:1 on white) | `green` | Approval and success paths, “on brand” signals |

Steps: 1–2 backgrounds · 3–5 element backgrounds (rest/hover/selected) · 6–7 borders/focus · 8 identity · 9–10 solid fills (rest/hover) · 11 low-contrast text · 12 high-contrast text. Tailwind: `bg-orchid-9`, `text-orchid-11`, `border-sage-6` …

### Secondary (9)

Each has `solid`, `soft` (tint background) and `text` (AA on soft), with dark-mode equivalents. Tailwind: `bg-honey`, `bg-honey-soft`, `text-honey-text`.

| Name | Solid | Use |
|------|-------|-----|
| **Plum** | `#5E3D66` | Deep accent for display moments, dark studio surfaces, selected nav on dark |
| **Lavender mist** | `#EFE4F1` | Selected rows/cards, Orchid-tinted callouts |
| **Forest** | `#3F6B3A` | Approved status, success icons and text |
| **Sage mist** | `#E1ECDF` | Success/approved backgrounds, on-brand check panels |
| **Clay** | `#C47A5A` | Idea-first journey, seed-idea callouts |
| **Honey** | `#D4A03F` | Waiting on client / pending review, warnings, nudges |
| **Dusk** | `#6B7FB0` | Info banners and tips, long-form links, neutral data series |
| **Brick** | `#B04A5A` | Rejected/declined, destructive actions (5.3:1 with white), errors |
| **Coral** | `#D9826B` | Changes requested (“Fix & resend”), non-error attention |

### Neutral (7, mirroring Radix `mauve`)

| Name | Light | Dark | Use |
|------|-------|------|-----|
| **Paper** | `#FAF9FB` | `#121113` | App canvas |
| **Surface** | `#FFFFFF` | `#1A191B` | Cards, dialogs, popovers |
| **Mist** | `#F2EFF3` | `#232225` | Muted panels, inputs, secondary buttons |
| **Line** | `#DBD8E0` | `#3C393F` | Borders, dividers |
| **Pewter** | `#84828E` | `#7C7A85` | Disabled text/icons, decorative strokes |
| **Slate** | `#65636D` | `#B5B2BC` | Secondary text, captions, metadata |
| **Ink** | `#211F26` | `#EEEEF0` | Primary text, headings |

### Review states and journeys

| State | Creator label | Tone | Colour |
|-------|---------------|------|--------|
| `draft` | Working | muted | Neutral |
| `agency_review` | Internal check | primary | Orchid |
| `submitted`, `brand_review` | Waiting on client | pending | Honey |
| `changes_requested` | Fix & resend | warning | Coral |
| `approved` | Approved | success | Forest |
| `rejected` | Not moving forward | destructive | Brick |
| Journey: brand-first | — | — | Orchid |
| Journey: idea-first | — | — | Clay |

Mapping lives in `TONE_COLORS` / `JOURNEY_COLORS` (`tokens.ts`); `StatusBadge` reads it via `src/lib/handoff/human-status.ts`.

### Dark mode

Every token switches under `.dark` (generated). Canvas Paper `#121113`, surfaces `#1A191B`; Orchid/Sage step 9 is unchanged so buttons read the same in both modes; tints become deep, text becomes light.

## Spacing

- **Base unit:** 4px
- **Density:** **Comfortable** in marketing; **compact-comfortable** in review and generation (more information per screen without clutter).
- **Scale:** 2xs(2) xs(4) sm(8) md(12) lg(16) xl(24) 2xl(32) 3xl(48) 4xl(64)

### Layout rhythm

- Page padding: `24px` desktop, `16px` mobile
- Card padding: `16px` default, `20px` for review sidebar
- Section gap: `24px` between major blocks, `12px` within forms

## Layout

- **Approach:** **Hybrid** — grid-disciplined app shell; editorial asymmetry on landing only.
- **Grid:** 12-column fluid; max content width `1280px` for dashboard lists; review view full-bleed with fixed sidebars.
- **App shell:** Sidebar `240px` (collapsible to `64px` icon rail); header `60px`.
- **Border radius:** sm `6px`, md `10px`, lg `14px`, full `9999px` (avatars, pills only).
- **Shadows:** `shadow-card` and `shadow-card-hover` from existing tokens; no heavy elevation.

### Key screen patterns

| Screen | Pattern |
|--------|---------|
| Dashboard | Stat row + 2-column widgets (pending reviews prominent) |
| Campaign detail | Pipeline rail (Brief → Concepts → Copy → Images → All assets) + brief snippet bar; stage canvas full height |
| Review queue | Campaign-grouped cards; Honey “waiting” badge |
| Asset review | 3-column: optional queue strip \| asset preview \| details + actions |
| Approved library | Dense grid with status=approved only; download affordance clear |

## Motion

- **Approach:** **Intentional** — motion communicates state, never decorates.
- **Easing:** enter `cubic-bezier(0, 0, 0.2, 1)`, exit `cubic-bezier(0.4, 0, 1, 1)`, move `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Duration:** micro 100ms (hover), short 200ms (modals, toasts), medium 300ms (page transitions), long 500ms (onboarding steps only).
- **Respect:** `prefers-reduced-motion` — disable non-essential animation (already in globals).

## Components — `@/design-system` on Radix Themes

- **Radix Themes** (`@radix-ui/themes`) is the component layer. `JigiTheme` (in `main.tsx`) sets `accentColor="iris"` (= Orchid), `grayColor="mauve"`, `radius="medium"`.
- Radix CSS is imported into an `@layer radix` that sits **below Tailwind utilities**, so `className` overrides always win.
- Screens import from **`@/design-system`**, never style Radix directly: `Button` (primary/secondary/outline/ghost/destructive), `ToneBadge`, `JourneyBadge`, `Callout` (info/success/warning/danger/brand/idea), `Panel`, `PageTitle`, `DisplayTitle`, `SectionTitle`, `Eyebrow`. Form controls use Radix Themes directly (`TextField`, `Select`, `TextArea`, `Switch`, `Checkbox`, `SegmentedControl`).
- Existing shadcn components in `src/components/ui/` keep working — their CSS variables (`--primary`, `--border` …) now alias the same tokens. Migrate screen by screen to `@/design-system`; delete a shadcn component once unused.
- **Drift tests:** `src/design-system/*.test.ts(x)` — contrast, token↔CSS sync, Radix mauve parity, no hard-coded colours in app code, no `font-serif`, no bold Krona.

### Rebuild priorities

1. **Status badge** — Single component mapping `src/lib/status.ts` to color + icon + label.
2. **Asset card** — Unified for generation grid, review queue preview, approved library (type icon, status, primary action).
3. **Review action bar** — Fixed bottom on Asset Review; Approve / Request changes / Reject with clear hierarchy (approve = primary).
4. **Empty states** — Illustration-free; Krona One headline + one CTA per docs/UI-IMPROVEMENT-PHASES.
5. **Submit for review** — Visible on Generated tab, not only All Assets dropdown.

## Anti-patterns (do not ship)

- Gradients of any hue behind UI or asset previews; 3-column icon feature grids on landing
- Raw Tailwind palette classes (`teal-600`, `amber-500` …) or hex in `className` — use tokens
- Raw `#A47DAB` / `#84AB7D` behind white text (fails contrast — use step 9)
- Inter, Roboto, Space Grotesk as primary UI font
- Direct status updates bypassing API (use submit/review flows)
- Hiding review actions in nested menus only
- Identical card treatment for draft vs approved assets (status must be obvious at a glance)

## Competitive research summary (2026)

- **Layer 1 (table stakes):** Visual annotation context, multi-stage approval, version/history, notifications, audit trail, client-friendly review links.
- **Layer 2 (trending):** Asset-first proofing UI, campaign-grouped queues, automated nudges, brand guideline checks surfaced in review.
- **Layer 3 (Jigi opportunity):** Competitors proof *uploaded* files; Jigi generates *and* governs in one loop. UI should show generation mode (brand-grounded vs idea-first) and compliance summary inline in review — not a separate admin screen.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-27 | Initial design system (design-consultation) | Rebuild seed; retain teal/cream brand equity, evolve typography and review-first layouts |
| 2026-06-27 | Source Sans 3 + Fraunces pairing | Avoid AI-slop sans convergence; serif display supports "creative craft" memorable thing |
| 2026-06-27 | Asset-first review layout | Matches proofing category leaders; reduces time-to-decision for approvers |
| 2026-06-27 | Amber = idea-first / pending | Semantic color teaches dual journey without extra copy |
| 2026-10-13 | **Orchid `#A47DAB` + Sage `#84AB7D` replace teal** (user brief) | Near-complementary pair; Orchid = action, Sage = approval. Brand hexes kept as step 8; step 9 deepened for AA. Supersedes teal/amber/cream. |
| 2026-10-13 | **Krona One replaces Fraunces** for display (user brief) | Single-weight wide grotesk: titles ≥20px only, never bold |
| 2026-10-13 | Idea-first moves Amber → **Clay**; pending stays warm (**Honey**) | Separates “which journey” from “who is waiting” |
| 2026-10-13 | **Radix Themes** via `@/design-system` wrappers, incremental migration | Token bridge keeps 60 shadcn components consistent while screens migrate |
| 2026-10-13 | Design patterns library in-app at `/app/design-system` (admin + dev) | Rendered from tokens, so the library cannot drift from the code |

## Implementation map

| Token / pattern | File(s) |
|-----------------|---------|
| Colour + type tokens | `uiux/jigi-app/src/design-system/tokens.ts` |
| Generated CSS | `src/styles/jigi-theme.css` (`pnpm theme:build`) |
| Semantic aliases (shadcn vars) | `src/styles/globals.css` |
| Radix root | `src/design-system/JigiTheme.tsx`, `src/main.tsx` |
| Components | `src/design-system/components.tsx`, `typography.tsx`, `tones.ts` |
| Library page | `src/pages/DesignSystem.tsx` → `/app/design-system` |
| Fonts | `index.html` |
| Status badges | `src/lib/handoff/human-status.ts` + `src/components/ui/StatusBadge.tsx` |
