# Design System — Jigi

**Created:** 2026-06-27 via `/design-consultation`  
**Status:** Source of truth for UI rebuild and polish

## Product Context

- **What this is:** Brand–agency creative workflow platform — AI generation (concepts, copy, images) with in-app human review and approval.
- **Who it's for:** Agency creators, brand approvers, and admins coordinating campaign creative from brief to approved asset.
- **Space/industry:** Creative approval / brand governance (peers: Filestage, Approval Studio, StreamWork, Planable).
- **Project type:** B2B web app (dashboard + review workspace) with marketing landing.

**Memorable thing:** *Approved creative, on your brand's terms — fast, visible, in one place.*

Every design decision should reinforce clarity (what needs my action?), trust (audit trail, status), and speed (fewer clicks from generate → approve).

## Aesthetic Direction

- **Direction:** **Refined utilitarian** — warm editorial surfaces for brand/campaign context; dense, calm utility for generation and review.
- **Decoration level:** **Intentional** — warm cream grounds, subtle borders/shadows; no gradient heroes or decorative blobs.
- **Mood:** Professional but human. Feels like a creative studio's internal tool, not generic SaaS. Warm paper, sharp hierarchy, teal as decisive action color.
- **Reference patterns:** Category leaders use neutral shells + strong asset preview + status chips (Filestage, Frame.io). Jigi differentiates with **brand-grounded generation** and **dual journey** (brand-first vs idea-first) visible in UI semantics.

### Safe choices (category baseline)

- Neutral app shell (sidebar + header + content) — users expect this for workflow tools.
- Semantic status colors for review states (draft, submitted, approved, rejected, changes requested).
- Card-based campaign and asset lists with clear primary actions.

### Creative risks (where Jigi gets its face)

1. **Serif display for campaign/brand titles only** — Fraunces on marketing and campaign headers signals “creative craft” without harming data density in tables and review UI.
2. **Asset-first review layout** — Review screen treats the creative as the hero (≥60% viewport), metadata and actions in a fixed sidebar; mimics proofing tools, not admin CRUD.
3. **Journey semantics in color** — Amber accent reserved for *idea-first* and *pending review*; teal for primary actions and success paths. Users learn the product's two modes visually.

## Typography

- **Display / Campaign titles:** **Fraunces** (600–700) — editorial warmth; use on campaign detail headers, landing hero, empty states.
- **Body / UI:** **Source Sans 3** (400–600) — highly legible at small sizes; supports tabular figures for stats; replaces overused geometric sans while staying neutral.
- **UI labels / buttons:** Source Sans 3, 500–600, 13–14px.
- **Data / tables:** Source Sans 3 with `font-variant-numeric: tabular-nums` on metrics and counts.
- **Code / prompts:** **Geist Mono** — generation logs, API snippets, prompt previews.
- **Loading:** Google Fonts — `Fraunces`, `Source Sans 3`, `Geist Mono`.
- **Migration note:** Current app uses Plus Jakarta Sans; migrate incrementally — Source Sans 3 for app shell first, Fraunces for display roles.

### Type scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `text-display` | 2.25rem / 36px | 600 (Fraunces) | Landing hero, campaign title |
| `text-h1` | 1.5rem / 24px | 600 | Page titles |
| `text-h2` | 1.125rem / 18px | 600 | Section headers |
| `text-body` | 0.875rem / 14px | 400 | Default body |
| `text-small` | 0.75rem / 12px | 400–500 | Meta, timestamps, badges |
| `text-label` | 0.6875rem / 11px | 600 uppercase tracking-wide | Form labels, table headers |

## Color

- **Approach:** **Balanced restrained** — teal is the only strong brand chroma; neutrals carry most UI; amber and semantic colors carry meaning.

### Core palette

| Token | Hex | Usage |
|-------|-----|--------|
| `background` | `#FEFDFB` | App canvas (warm cream) |
| `foreground` | `#1C1917` | Primary text (stone-900) |
| `card` | `#FFFFFF` | Cards, modals |
| `muted` | `#F5F0EB` | Secondary surfaces |
| `muted-foreground` | `#78716C` | Secondary text |
| `border` | `#E7E0D9` | Dividers, inputs |
| `primary` | `#0D9488` | Primary CTA, active nav, links (teal-600) |
| `primary-hover` | `#0F766E` | Hover on primary |
| `primary-muted` | `#F0FDFA` | Teal tint backgrounds |

### Journey & status

| Token | Hex | Usage |
|-------|-----|--------|
| `idea-first` | `#D97706` | Idea-first badges, seed-idea callouts |
| `pending-review` | `#F59E0B` | Queue badges, nudge states |
| `success` | `#16A34A` | Approved |
| `warning` | `#D97706` | Changes requested |
| `error` | `#DC2626` | Rejected |
| `info` | `#0D9488` | Submitted / in review |

### Dark mode

- Background `#1C1917`, card `#292524`, reduce primary saturation ~15%, keep warm stone text `#F5F0EB`.
- Status backgrounds use deep tints (already partially in `globals.css`).

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
| Review queue | Campaign-grouped cards; amber pending badge |
| Asset review | 3-column: optional queue strip \| asset preview \| details + actions |
| Approved library | Dense grid with status=approved only; download affordance clear |

## Motion

- **Approach:** **Intentional** — motion communicates state, never decorates.
- **Easing:** enter `cubic-bezier(0, 0, 0.2, 1)`, exit `cubic-bezier(0.4, 0, 1, 1)`, move `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Duration:** micro 100ms (hover), short 200ms (modals, toasts), medium 300ms (page transitions), long 500ms (onboarding steps only).
- **Respect:** `prefers-reduced-motion` — disable non-essential animation (already in globals).

## Components (rebuild priorities)

1. **Status badge** — Single component mapping `src/lib/status.ts` to color + icon + label.
2. **Asset card** — Unified for generation grid, review queue preview, approved library (type icon, status, primary action).
3. **Review action bar** — Fixed bottom on Asset Review; Approve / Request changes / Reject with clear hierarchy (approve = primary).
4. **Empty states** — Illustration-free; Fraunces headline + one CTA per docs/UI-IMPROVEMENT-PHASES.
5. **Submit for review** — Visible on Generated tab, not only All Assets dropdown.

## Anti-patterns (do not ship)

- Purple/violet gradients, 3-column icon feature grids on landing
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

## Implementation map

| Token / pattern | File(s) to update |
|-----------------|-------------------|
| CSS variables | `uiux/jigi-app/src/styles/globals.css` |
| Fonts | `index.html` or font loader, `@theme` in globals |
| Status badges | `src/lib/status.ts` + shared `StatusBadge` component |
| Review layout | `src/pages/AssetReview.tsx`, `src/components/review/*` |
| Campaign workspace | `src/pages/CampaignDetail.tsx`, `src/components/campaign/*`, `GenerationPanel.tsx` |

**Next gstack steps:** `/plan-design-review` to audit existing screens against this doc; `/autoplan` for phased rebuild; `/design-html` for Pretext-native HTML prototypes of key screens.
