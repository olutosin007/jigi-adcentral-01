# Anchor inventory

The bridge artifact. Every tour step, every doc step, and (later) every E2E selector points at one of these `data-tour` ids. Add the attribute to the listed element in build step 2; nothing else about the component changes.

## Convention

- Attribute: `data-tour="<id>"`.
- Ids are **stable** — renaming one is a breaking change for the tour and tests.
- Attach to the **outermost element of the thing being pointed at** (the panel/card/button), not a deep child, so the spotlight frames it well.
- One id = one on-screen target. If a step needs the whole panel *and* a button inside it, give them separate ids (e.g. `generation-panel`, `submit-action`).

## Agency Creative

| Anchor id | Route | Component file | Attach to | Tour step |
|-----------|-------|----------------|-----------|-----------|
| `journey-choice` | `/setup/journey` | `src/pages/setup/JourneyChoice.tsx` | The two journey option cards (wrapper) | Pick journey |
| `brand-create` | `/app/brands` | `src/pages/Brands.tsx` + `src/components/brands/QuickCreateBrandDialog.tsx` | "Create brand" trigger | Create/confirm brand |
| `brief-form` | `/app/campaigns/new` | `src/components/campaigns/BriefForm.tsx` | Brief form container | Enter brief |
| `generation-panel` | `/app/campaigns/:id` | `src/components/generation/GenerationPanel.tsx` | Panel root | Generate concept/copy/image |
| `compliance-panel` | `/app/campaigns/:id` | `src/components/generation/ComplianceDisplay.tsx` | Compliance/drift block | Check compliance |
| `submit-action` | `/app/campaigns/:id` | `src/components/review/SubmitModal.tsx` | Confirm **Submit** button inside the modal (the tour opens the modal for this step; per-asset openers are dynamic) | Submit for review |
| `approved-assets` | `/app/approved` | `src/pages/ApprovedAssets.tsx` | Approved grid / first card | See approved result |

## Brand Approver

| Anchor id | Route | Component file | Attach to | Tour step |
|-----------|-------|----------------|-----------|-----------|
| `notification-bell` | any `/app/*` | `src/components/notifications/NotificationBell.tsx` | Bell button | Open notification |
| `review-queue` | `/app/review` | `src/pages/ReviewQueue.tsx` + `src/components/review/ReviewQueueCard.tsx` | Queue list / first card | Open review queue |
| `asset-preview` | `/app/review/:assetId` | `src/components/review/AssetPreviewArea.tsx` | Preview area root | Inspect the asset |
| `asset-details` | `/app/review/:assetId` | `src/components/review/AssetDetailsSidebar.tsx` | Details sidebar root | Review brief + compliance + history |
| `comments-sidebar` | `/app/review/:assetId` | `src/components/comments/CommentsSidebar.tsx` | Comments panel root | Discuss (optional) |
| `review-actions` | `/app/review/:assetId` | `src/components/review/ReviewActions.tsx` | Action button group | Approve / reject / request changes |

## Cross-cutting (both personas)

| Anchor id | Component file | Attach to | Purpose |
|-----------|----------------|-----------|---------|
| `sidebar-nav` | `src/components/layout/Sidebar.tsx` | Nav root | Orientation step at tour start |
| `role-switch` | _(new, build step 4)_ | Demo "view as" toggle | Hand off Creative → Approver in one session |

## Step registries (machine-readable twin — for build step 3)

These are the ordered step lists the onborda tours will consume. They mirror the happy-path tables in the persona docs. Kept here as the canonical order; the implementation module should import/reflect this exactly.

**Creative tour:** `sidebar-nav` → `journey-choice` → `brand-create` → `brief-form` → `generation-panel` → `compliance-panel` → `submit-action` → `approved-assets`

**Approver tour:** `sidebar-nav` → `notification-bell` → `review-queue` → `asset-preview` → `asset-details` → `review-actions`

**Combined demo tour** (uses `role-switch` at the handoff): Creative tour → `role-switch` → Approver tour.

## Status: persistence + auto-start + analytics (build step 5 complete)

The walkthrough now persists, auto-starts, and emits analytics:

- **Persistence:** `src/store/tourStore.ts` (localStorage `jigi-tour-store`) tracks `completed` and `autoStarted` per tour.
- **First-login auto-start:** `src/hooks/useTourAutoStart.ts` + headless `TourAutoStart` (mounted inside `OnbordaProvider`). Starts the tour matching the user's **real** role once ever — never on mobile, and never while a demo "view as" preview or another tour is active. Reviewer/approver → approver tour; otherwise → creative tour.
- **Replay + reset:** Settings → Product walkthrough replays either tour; "Reset walkthroughs" clears state so auto-start fires again.
- **Analytics:** `src/lib/analytics.ts` (`trackTourEvent`) emits `tour_started` / `tour_step_viewed` / `tour_completed` / `tour_skipped` / `tour_handoff`. Provider-agnostic: forwards to `window.analytics.track` if present, dispatches a `jigi:analytics` CustomEvent, and logs in dev. `TourCard` owns completion/skip + per-step events; `useTourLauncher` emits start (with `source`).

---

## Status: demo handoff wired (build step 4 complete)

The demo **"view as" role-switch** and **id-aware steps** are implemented:

- **Demo store:** `src/store/demoStore.ts` — client-only `viewAsRole` override plus resolved `demoCampaignId` / `demoAssetId`. Presentation only; Supabase RLS remains the security boundary.
- **Effective role:** `src/hooks/useEffectiveRole.ts` — `viewAsRole ?? profile.role`. Now drives Sidebar "Review" visibility, the Header Review CTA, and `ReviewerRoute` gating.
- **Switcher (carries `role-switch` anchor):** `src/components/tour/ViewAsSwitcher.tsx`, mounted in the Header. Options: Agency Creative / Brand Approver / Back to your role.
- **Id-aware steps:** `buildTourSteps({ campaignId, assetId })` in `src/lib/tour/steps.tsx`; `AppLayout` recomputes steps from the demo store. `useTourLauncher` resolves the most-recent campaign and an in-review asset at start.
- **Handoff:** the creative tour ends on a `role-switch` step whose "View as approver" button flips the role, seeds the review asset id, and auto-starts the approver tour.

---

## Status: wired (build step 3 complete)

All `data-tour` attributes are present in the codebase, and the tour library is now installed and wired.

**Tour library:** `onborda` targets Next.js (hard-imports `next/navigation`) and cannot run in this Vite + React Router app, so we use **`onborda-rrd`** — the React Router DOM fork with the identical API and shadcn/framer-motion styling.

**Wiring:**
- Step registries (the machine-readable twin of this file): `src/lib/tour/steps.tsx` — exports `tourSteps` and `TOURS`.
- Custom tooltip themed to the design system: `src/components/tour/TourCard.tsx`.
- `OnbordaProvider` + `Onborda` wrap the app shell in `src/components/layout/AppLayout.tsx`.
- Provisional launcher: Settings → Profile → "Product walkthrough" (two buttons calling `startOnborda`).

**Implementation notes:**

- **`brand-create`** is on both the empty-state "Create brand" button and the populated toolbar "Add brand" button — only one renders at a time, so the anchor is always present.
- **`compliance-panel`** is on all three render branches of `ComplianceDisplay` (loading / no-check / result), so the anchor exists in every state.
- **`submit-action`** is on the confirm Submit button inside `SubmitModal`; the tour must open the modal before highlighting this step.
- **`journey-choice`** is intentionally **omitted from the live creative tour**: it lives at `/setup/journey`, outside the `/app` shell (and therefore outside `OnbordaProvider`). It stays in the registry as pre-app orientation, not a live coach-mark.
- **Route hops** use onborda's `nextRoute` only for *static* routes (`/app/brands`, `/app/campaigns/new`, `/app/review`, `/app/approved`). Campaign- and asset-scoped steps (generation, compliance, submit, review detail) need a concrete `:id` and are driven by the demo "view as" / seeded-data layer in build step 4.
- **`role-switch`** is implemented on the Header's "View as" switcher (`ViewAsSwitcher`) — see build step 4 above.
