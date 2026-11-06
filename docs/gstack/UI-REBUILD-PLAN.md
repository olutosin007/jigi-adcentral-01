# Jigi UI Rebuild Plan — Design Review Output

**Reviewed:** 2026-06-27 via `/plan-design-review`  
**Objectives:** Brand–agency creative workflow; generate → submit → review → approve in-app; shorten handoff to "brand said yes."  
**Sources:** [DESIGN.md](../../DESIGN.md), [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md), [UI-IMPROVEMENT-PHASES.md](../UI-IMPROVEMENT-PHASES.md), current `uiux/jigi-app` implementation.

**Initial design completeness:** 5/10 — strong product intent and DESIGN.md tokens, but screen-level hierarchy, state coverage, and journey wiring are underspecified; implementation still hides submit/review paths.

**Target after fixes in this plan:** 8/10 — implementable without guessing; remaining 2 points need `/design-html` mockups and live `/design-review` after ship.

---

## What already exists

| Asset | Location | Reuse |
|-------|----------|--------|
| DESIGN.md | repo root | Tokens, patterns, anti-patterns |
| Status model | `src/lib/status.ts` | Single source for badges and transitions |
| Review APIs | `api/assets/submit.ts`, `api/assets/review.ts` | Backend truth for notifications |
| Review Queue + Asset Review | `ReviewQueue.tsx`, `AssetReview.tsx` | Asset-first layout partially there; keyboard shortcuts exist |
| Submit flow | `SubmitModal` + `useSubmitAsset` on CampaignDetail **All Assets** tab only | Wire to Generated tab |
| Dashboard widgets | `PendingReviewsWidget`, stats | Foreground reviewer/creator modes |
| globals.css | Teal/cream tokens, dark mode vars | Align code to DESIGN.md fonts |

---

## Information hierarchy (Pass 1: 4/10 → 9/10)

### Principle: "What needs my action?" first (DESIGN.md memorable thing)

**Creator mode** (agency): Campaign → Generate → **Submit** → track status  
**Reviewer mode** (brand/admin): Dashboard **Pending** → Review Queue → Asset Review → decision

### Screen hierarchy (ASCII)

```
APP SHELL
├── Sidebar: Create (Campaigns) | Manage (Brands) | Review (Queue, Approved) | System
├── Header: context title + notifications bell
└── Main

DASHBOARD (role-aware)
  1. Pending reviews count + CTA "Review now" (if approver & count > 0)
  2. Quick actions: New campaign
  3. Stats: Pending | Active | Approved
  4. Recent campaigns + generation mix

CAMPAIGN DETAIL
  1. Campaign title (Fraunces) + brand + journey badge (idea-first = amber)
  2. Sub-nav: Brief | Generated | All Assets  ← Generated is primary workspace
  3. GENERATED TAB:
     - Prompt + generate (concepts | copy | images)
     - Asset grid with STATUS BADGE + primary row action: Submit for review
  4. ALL ASSETS: bulk ops, filters (secondary)

REVIEW QUEUE
  1. "Pending your review" (count)
  2. Campaign-grouped cards → Start review
  3. Recently reviewed (collapsed on mobile)

ASSET REVIEW
  1. Asset preview (dominant)
  2. Compliance + generation mode + channel constraints (sidebar)
  3. Fixed action bar: Approve | Request changes | Reject
```

### Fixes added to plan

- **P1:** Add **Submit for review** to Generated tab asset cards and detail modals (not only All Assets ⋮ menu).
- **P1:** Dashboard pending widget becomes **first visual block** when `pendingReview > 0` for approver roles.
- **P2:** Campaign header shows **journey badge** (brand-grounded vs idea-first) per DESIGN.md amber semantics.

---

## Interaction state coverage (Pass 2: 5/10 → 9/10)

| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Generate concepts/copy/images | Skeleton cards in panel | "Generate your first concept" + CTA + brief link | Toast + inline retry on API fail | New cards animate in; toast | Some assets failed in batch → show which |
| Submit for review | Modal button spinner | N/A (disabled if no valid transition) | Toast with API message (invalid transition) | Toast + status badge update + queue refresh | Bulk submit: per-asset result summary |
| Review queue | Skeleton campaign cards | "All caught up" + link to campaigns | Permission/RLS error banner | Cards with pending count | Filter returns zero → "No matches" + clear filters |
| Asset review | Full-page skeleton | 404 asset → back to queue CTA | Review API error toast; keep on page | Toast + auto-advance to next in queue | Comments loading separate from asset |
| Approved library | Grid skeleton | "No approved assets yet" + link to campaigns | Fetch error | Download success toast | Campaign group empty → hide group |
| Notifications bell | Dot + skeleton list | "No notifications" | Fetch fail silent + retry | Mark read | Unread count badge |

**Empty state rule:** Fraunces headline (one line) + one sentence + **one primary CTA**. No illustration blobs.

---

## User journey & emotional arc (Pass 3: 6/10 → 8/10)

| Step | User does | Should feel | Plan specifies |
|------|-----------|-------------|----------------|
| 1 | Creates campaign + brief | Oriented, in control | Brief tab clear; seed idea callout if idea-first |
| 2 | Generates first asset | Delight, momentum | Loading skeleton; first result prominent |
| 3 | Submits for review | Confidence ("it's in the system") | Submit on Generated tab; modal with agency vs brand target |
| 4 | Reviewer gets notification | Urgency without anxiety | Email + in-app; dashboard pending block |
| 5 | Reviewer opens queue | Clarity (what's waiting) | Campaign grouping; oldest-first sort default |
| 6 | Approves asset | Decisive, fast | Asset-first layout; keyboard shortcuts |
| 7 | Creator sees approval | Relief, closure | Notification + status on asset; Approved library |

**5-second test (reviewer):** Open app → see pending count → one click to review.  
**5-minute test (creator):** Campaign → generate image → submit → see "Submitted" without hunting menus.

---

## AI slop & specificity (Pass 4: 6/10 → 8/10)

**Classifier:** HYBRID — marketing landing + APP UI workspace.

### Hard rejection check (current implementation)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Generic SaaS card grid as first impression | **RISK** on Dashboard widget mosaic — mitigate by leading with pending CTA block, not 3 equal stat cards |
| 2 | Beautiful image, weak brand | Landing OK; app shell needs Fraunces on campaign titles |
| 3 | Headline, no clear action | **FIX:** Generated tab must expose Submit on each draft asset |
| 4 | Busy imagery behind text | None in app shell |
| 5 | Repeating mood sections | None |
| 6 | Carousel without purpose | None |
| 7 | Stacked cards instead of layout | **RISK** on GenerationPanel — use list/grid with clear primary column, not nested card stacks |

### Litmus scorecard

| Check | Result |
|-------|--------|
| Brand unmistakable first screen | Partial — teal present; migrate display type to Fraunces on campaign/landing |
| One strong visual anchor | Teal primary CTA — keep |
| Scannable by headlines | Improve section labels ("Pending your review" not generic "Widgets") |
| Each section one job | Dashboard sections need role split |
| Cards necessary | Queue cards yes; stat cards could merge into one summary row |
| Motion improves hierarchy | Keep subtle entrance on dashboard only |
| Premium without decorative shadows | Yes — existing shadow tokens are light |

### Specificity fixes

- Replace scattered `statusStyles` in AssetCard, ImageCard, etc. with shared **`StatusBadge`** from `status.ts` + DESIGN.md journey colors.
- Typography migration: **Source Sans 3** body, **Fraunces** display (DESIGN.md); remove duplicate Plus Jakarta only after font load added.

---

## Design system alignment (Pass 5: 7/10 → 9/10)

DESIGN.md exists and is authoritative. Gaps:

| DESIGN.md says | Code today | Action |
|----------------|------------|--------|
| Source Sans 3 + Fraunces | Plus Jakarta everywhere | Phase font migration in globals + index.html |
| Amber = idea-first / pending | Amber on idea-first badge only; submitted uses blue in some cards | Unify via StatusBadge |
| Asset-first review ≥60% | AssetReview has preview + sidebar — good | Verify mobile: preview stacks above actions |
| Submit on Generated tab | **Missing** — only All Assets | **P1 implement** |
| Shared StatusBadge | Per-component statusStyles maps | **P1 create component** |

---

## Responsive & accessibility (Pass 6: 4/10 → 8/10)

### Responsive

| Viewport | Behavior |
|----------|----------|
| Desktop ≥1024px | Sidebar 240px; review 3-column (strip \| preview \| sidebar) |
| Tablet 768–1023px | Collapsible sidebar; review 2-column (preview \| sidebar); queue strip hidden |
| Mobile <768px | Drawer sidebar; review **preview full width**, actions **fixed bottom bar** (44px min touch); queue single column |

### Accessibility

- All review actions reachable via keyboard (already in AssetReview — document in plan).
- Focus rings: use `.focus-ring` utility on new Submit buttons.
- Status badges: icon + text, not color alone.
- ARIA: Review queue lists `role="list"`; asset review main `aria-label="Asset preview"`.
- Contrast: body text ≥14px (`text-body`); muted text still ≥4.5:1 on cream.

---

## Unresolved decisions (Pass 7)

| Decision | Recommendation | If deferred |
|----------|----------------|-------------|
| Mobile review: bottom bar vs drawer actions? | **Bottom fixed bar** (proofing apps pattern) | Engineer ships cramped header buttons |
| Compliance summary in review sidebar vs tab? | **Sidebar collapsible section** default open | Reviewers miss brand checks |
| Show generation mode on every asset card? | **Yes** — small badge (idea-first amber / brand-grounded teal tint) | Dual journey invisible |
| Sort review queue default? | **Oldest waiting first** | Newest hides stale items |

**Recommended defaults above** — proceed unless user overrides.

---

## NOT in scope (this rebuild pass)

- Composio / Slack / Notion integrations
- Full DAM, version diff UI, side-by-side compare (post-MVP)
- Paid ad activation / Meta publish
- Complete landing page redesign (Phase 5+ in UI-IMPROVEMENT-PHASES)
- Font migration on marketing templates outside jigi-app shell

---

## Eng Review — Wave 1 scope (accepted 2026-06-27)

**Scope decision:** Ship **T1 + T2 + T3 + T7** in one PR. Defer **T4–T6** to Wave 2.

### Decisions log

| ID | Decision | Choice |
|----|----------|--------|
| D1 | PR scope | Wave 1 (T1+T2+T3+T7) |
| D2 | Submit modal owner | CampaignDetail keeps SubmitModal; pass `onSubmitAsset` → GenerationPanel |
| D3 | StatusBadge | `components/ui/StatusBadge.tsx` wrapping `getStatusConfig()` from `status.ts` |
| D4 | Queue sort | `updated_at` ascending in `fetchReviewQueue` |
| D5 | Dashboard reorder gate | `profile.role` in `admin` \| `approver` \| `reviewer` AND `pendingCount > 0` |
| D6 | Submit affordance | Visible Submit button on cards + detail modals (not ⋮ only) |
| D7 | Tests | GenerationPanel + CampaignDetail regression tests + StatusBadge unit test |

### Architecture (4 issues — all resolved)

1. **[P1] (9/10)** `CampaignDetail.tsx:694-698` — `GenerationPanel` has no submit prop; `AssetGrid` at `:711` has `onSubmitAsset`. **Fix:** Add `onSubmitAsset?: (assetId: string) => void` to GenerationPanel; thread to ConceptCard, CopyCard, ImageCard, detail modals.
2. **[P1] (9/10)** Six duplicate `statusStyles` maps vs `STATUS_CONFIG` in `status.ts:48-105`. **Fix:** StatusBadge component; delete inline maps in generation cards.
3. **[P2] (9/10)** `useCampaignQueries.ts:738` — `.order('created_at', { ascending: false })`. **Fix:** `.order('updated_at', { ascending: true })`.
4. **[P2] (8/10)** `Dashboard.tsx:110-125` — stats before pending widget. **Fix:** Conditional block order when reviewer role + pending count.

```
SUBMIT FLOW (Wave 1)
CampaignDetail
  ├── handleSubmitAsset(assetId)  → setSubmitModalAsset (L173-178)
  ├── SubmitModal → useSubmitAsset → POST /api/assets/submit
  ├── GenerationPanel(onSubmitAsset)     ← NEW
  │     ├── ConceptCard / CopyCard / ImageCard (onSubmit + visible button)
  │     └── *DetailModal (onSubmit)
  └── AssetGrid(onSubmitAsset)           ← existing
```

### Code quality (1 issue — resolved)

5. **[P1] (9/10)** `AssetCard.tsx:196-199` — Submit hidden in dropdown. Generated tab gets **visible** primary Submit per D6.

### Test review

**Framework:** Vitest + React Testing Library (`pnpm test` in `uiux/jigi-app/`).

```
CODE PATHS                                              USER FLOWS
[+] CampaignDetail.tsx                                  [+] Generate → Submit (Wave 1)
  ├── handleSubmitAsset()                                 ├── [GAP→E2E] Full journey (defer /qa)
  │   ├── [GAP] GenerationPanel receives callback        ├── [GAP] Submit from Generated tab
  │   └── [★★ TESTED] AssetGrid path — partial           └── [GAP] Reviewer sees pending first
  └── SubmitModal → useSubmitAsset
      ├── [★★ TESTED] mocked in CampaignDetail.test.tsx
      └── [GAP] assert onSubmitAsset passed to GenerationPanel

[+] GenerationPanel.tsx
  ├── ConceptCard / CopyCard / ImageCard
  │   ├── [GAP] draft shows Submit button
  │   └── [GAP] onSubmit fires with assetId
  └── *DetailModal onSubmit

[+] StatusBadge.tsx (new)
  └── [GAP] each status renders label + icon from STATUS_CONFIG

[+] fetchReviewQueue (useCampaignQueries.ts:730-738)
  └── [GAP] order updated_at ASC — useCampaignQueries.test or inline test

COVERAGE: 2/12 paths tested (17%)  |  GAPS: 10 (1 E2E deferred to /qa)
REGRESSION (mandatory): Generated-tab submit must have automated test per D7.
```

### Performance

No issues for Wave 1. DOM reorder only; queue sort change is single Supabase query (same shape).

### Failure modes (Wave 1)

| Path | Production failure | Test? | Handling | User sees |
|------|-------------------|-------|----------|-----------|
| Submit invalid transition | Asset not draft/agency_review | GAP | `getValidTransitions` toast L169-171 | Error toast |
| Submit API fail | Network / RLS | GAP | catch L192-194 | Error toast |
| Queue sort wrong | Stale items buried | GAP after fix | — | Wrong queue order |
| StatusBadge unknown status | Legacy DB value | GAP | `getStatusConfig` fallback draft L107-108 | Shows Draft |

### Parallelization

**Sequential implementation** — shared files (`GenerationPanel`, card components, `CampaignDetail`) prevent clean worktree lanes. One developer / one PR.

### NOT in scope — Wave 2 (deferred)

| Task | Rationale |
|------|-----------|
| T4 Typography | Font swap risks visual regression across app; separate PR |
| T5 Empty states | Polish; not blocking submit/review loop |
| T6 Mobile review bar | Layout change isolated to AssetReview |
| E2E full journey | Manual `/qa` after Wave 1 lands |
| Journey badge on campaign header | Design P2; not in Wave 1 |

## Implementation Tasks

Synthesized from design + eng review. **Wave 1** — checkbox as you ship.

- [ ] **T1 (P1, human: ~3.5h / CC: ~30min)** — Generated tab submit — `onSubmitAsset` prop + visible Submit on cards/modals + All Assets `AssetCard`
  - Surfaced by: Design P1, Eng D2/D6, DESIGN.md anti-pattern (hidden ⋮ submit)
  - Files: `CampaignDetail.tsx`, `GenerationPanel.tsx`, `ConceptCard.tsx`, `CopyCard.tsx`, `ImageCard.tsx`, `ImagePreviewModal.tsx`, `ConceptDetailModal.tsx`, `CopyDetailModal.tsx`, `AssetCard.tsx`
  - Verify: Draft on Generated tab → Submit → modal → toast; All Assets card has visible Submit; focus ring on buttons

- [ ] **T2 (P1, human: ~2.5h / CC: ~25min)** — Refactor `StatusBadge` to use `status.ts` (icon + label)
  - Surfaced by: Design P1/P5, Eng D3 — existing `StatusBadge.tsx` duplicates config; 6× `statusStyles` in generation
  - Files: `StatusBadge.tsx`, `StatusBadge.test.tsx`, generation cards/modals, `AssetCard.tsx`
  - Verify: All seven `AssetStatus` values; icon + text visible; no inline `statusStyles` left in generation

- [ ] **T3 (P1, human: ~2h / CC: ~15min)** — Dashboard reviewer-first — pending widget above stats when `admin|approver|reviewer` + count > 0
  - Surfaced by: Design P1 Pass 1, Eng D5 — `Dashboard.tsx:110-125` order
  - Files: `Dashboard.tsx`
  - Verify: Approver + pending > 0 → `PendingReviewsWidget` before `QuickStatsWidget`; creator unchanged

- [ ] **T7 (P1, human: ~1.5h / CC: ~15min)** — Oldest-first queue — `updated_at` ASC on review queue + dashboard pending fetch
  - Surfaced by: Design P7, Eng D4 — `useCampaignQueries.ts:738`, `useDashboardQueries.ts:130`
  - Files: `useCampaignQueries.ts`, `useDashboardQueries.ts`, tests
  - Verify: Oldest `updated_at` first on `/app/review` and dashboard widget order

- [ ] **T-TEST (P1, human: ~1.5h / CC: ~25min)** — Regression tests per D7 + reconciliation AC
  - Files: `GenerationPanel.test.tsx`, `CampaignDetail.test.tsx`, `StatusBadge.test.tsx`, queue/dashboard tests
  - Verify: `pnpm test` green

### Wave 2 (deferred)

- [ ] **T4** — Typography migration (Source Sans 3 + Fraunces)
- [ ] **T5** — Interaction state table (empty/error per screen)
- [ ] **T6** — Mobile asset review bottom action bar
- [ ] **T8** — Campaign header journey badge (idea-first amber / brand-grounded)
- [ ] **T9** — Generation-mode badge on all asset cards (brand + idea, not idea-only)
- [ ] **T10** — Compliance summary collapsible in Asset Review sidebar

---

## Wave 1 reconciliation (design + eng — 2026-06-27)

Cross-check of `/plan-design-review` outputs against `/plan-eng-review` Wave 1. Goal: nothing required for the **generate → submit → review** loop is left unstated.

### Coverage matrix

| Design output | Eng task | Wave 1? | Notes |
|---------------|----------|---------|-------|
| P1 Submit on Generated tab + modals | T1 | **Yes** | Not implemented; `GenerationPanel` has no `onSubmitAsset` prop |
| P1 Dashboard pending first (approver) | T3 | **Yes** | Eng adds role gate (D5) — stricter than design, aligned with DESIGN.md |
| P1 Shared StatusBadge from `status.ts` | T2 | **Yes** | `StatusBadge.tsx` exists but duplicates config (no icons, wrong variants) — **refactor**, not greenfield |
| P7 Queue oldest-first | T7 | **Yes** | `fetchReviewQueue` still `created_at DESC` (:738); dashboard `fetchPendingReviews` already ASC — align both to `updated_at ASC` |
| P2 Journey badge on campaign header | T8 | Wave 2 | Design P2; not blocking loop |
| Pass 2 Submit interaction states | T1 | **Yes** | `SubmitModal` + toasts exist; add modal `isSubmitting` wire if missing on Generated path |
| Pass 6 Focus rings on Submit | T1 AC | **Yes** | Acceptance criterion, not separate task |
| Pass 6 Status icon + text (not color alone) | T2 AC | **Yes** | `STATUS_CONFIG` has icons; existing `StatusBadge` lacks them |
| Pass 6 ARIA on review queue / asset review | — | Wave 2 | With T5/T6 |
| Pass 7 Generation mode on every card | T9 | Wave 2 | `AssetCard` shows idea-first only; extend later |
| Pass 7 Compliance in review sidebar | T10 | Wave 2 | AssetReview scope |
| Pass 7 Mobile review bottom bar | T6 | Wave 2 | Isolated layout change |
| Anti-pattern: submit hidden in ⋮ only | T1 | **Yes** | Eng D6 = Generated tab; **also** upgrade `AssetCard` on All Assets (DESIGN.md anti-pattern) |
| DESIGN.md component #2 unified asset card | Partial | Wave 1 via T2 | Full unification deferred; status + submit visibility in Wave 1 |
| Regression tests | T-TEST | **Yes** | Mandatory per eng D7 |

### Gaps folded into Wave 1 (updated task specs)

**T1 additions:**
- Files: add `ImagePreviewModal.tsx` (images use this, not a detail modal — submit on `ImageCard` + modal when asset is saved)
- Files: add `AssetCard.tsx` — visible Submit button (not ⋮ only), same as Generated cards
- Acceptance: `focus-visible:ring-2` (or `.focus-ring`) on all new Submit buttons
- Acceptance: `changes_requested` assets show Submit when transition allows

**T2 additions:**
- **Refactor** existing `components/ui/StatusBadge.tsx` to use `getStatusConfig()` from `status.ts` (accept `AssetStatus` snake_case)
- Render **icon + label** per DESIGN.md a11y
- Migrate: `ConceptCard`, `CopyCard`, `ImageCard`, `ConceptDetailModal`, `CopyDetailModal`, `AssetCard` (6 files with duplicate `statusStyles`)
- Out of scope Wave 1: `CampaignDetail` campaign-status badge, `Brands.tsx` (different domain)

**T3 additions:**
- Use `profile.role` from `useAuthStore()` (already imported in `Dashboard.tsx:38`)
- Optional polish (same PR if trivial): promote existing quick-action "Pending Review" button visibility when reviewer + count > 0

**T7 additions:**
- Change `useCampaignQueries.ts:738` → `updated_at` ascending
- Change `useDashboardQueries.ts:130` → `updated_at` ascending (consistency when assets resubmit after changes_requested)
- Test both query functions or one shared sort helper

**T-TEST additions:**
- Dashboard reorder assertion (reviewer role + pending > 0)
- Queue sort unit test
- StatusBadge icon + all 7 `AssetStatus` values

### Intentionally not in Wave 1

| Item | Why deferred |
|------|----------------|
| T4 Typography | Visual regression risk across app; DESIGN.md says incremental migration |
| T5 Empty states | Widgets already have empty states; full state table is polish |
| T6 Mobile review bar | AssetReview-only; doesn't block desktop loop |
| T8–T10 | Journey/compliance/generation badges — design P2 or review-screen depth |
| E2E full journey | `/qa` after Wave 1 merge |
| Landing / marketing fonts | Explicitly out of scope in design review |

### Implementation order (Wave 1)

```
T2 (StatusBadge refactor) → T1 (submit wiring uses StatusBadge)
     ↓
T7 (queue sort) ∥ T3 (dashboard reorder)
     ↓
T-TEST (regression + sort + dashboard)
```

T2 before T1 avoids touching each card twice (status + submit in one pass per file).

### Current code reality (pre-implementation)

| Check | State |
|-------|--------|
| `GenerationPanel` submit prop | **Missing** |
| `StatusBadge` uses `status.ts` | **No** — parallel `statusConfig` in component |
| `fetchReviewQueue` sort | **Newest first** (wrong per plan) |
| `fetchPendingReviews` sort | **Oldest created_at** (OK-ish; align to `updated_at`) |
| Dashboard widget order | **Stats before pending** |
| `SubmitModal` loading state | **Exists** (`isSubmitting` prop) |


| Screen | Path | Direction |
|--------|------|-----------|
| Design system preview | `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/design-consultation-preview.html` | Teal/cream, Fraunces + Source Sans 3, dashboard + review mockups |

gstack designer binary not available — no AI mockup variants generated in this review.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | Wave 1 scope, 5 arch/CQ issues, 10 test gaps, 0 critical silent failures |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score: 5/10 → 8/10, 7 tasks, 4 decisions defaulted |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0 (7 eng decisions locked; T4–T6 + T8–T10 deferred to Wave 2 with rationale)
- **VERDICT:** ENG + DESIGN reconciled — **Wave 1 ready** (T2→T1→T7∥T3→T-TEST). 5 tasks + tests; design P2/review-depth items explicitly in Wave 2.
