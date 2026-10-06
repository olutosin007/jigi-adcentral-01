# Phase 1 — IA, Work Home & Job Stages

**Initiative:** [Handoff OS](./README.md)  
**Status:** Ready  
**Duration:** 3 sprints (~3 weeks)  
**Depends on:** Nothing (starts from current main)  
**Unlocks:** P2 Creative equal entry, P3 Guest Decide

---

## Goal

Replace the multi-door creator IA (Quick Start · Dashboard · Campaigns as equal homes) with a single **Work** home and a **Job** workspace whose stage rail encodes the product spine:

`Brief → Creative → Send → Decisions → Approved`

Language: human labels over raw status enums. Design: DESIGN.md stage canvas + context rail pattern.

---

## User-facing outcomes

| Who | After P1 |
|-----|----------|
| Creator | Lands on **Work**; every job shows a clear **next action** |
| Creator | Inside a job, stages replace tab sprawl as the primary mental model |
| Approver | Unchanged entry for now (still `/app/review`) — prep hooks only |
| Both | Status chips use human labels (Waiting on client, Fix & resend, …) |

---

## Sprint summary

| Sprint | Focus | Key deliverables |
|--------|--------|------------------|
| **1.1** | Nav + Work home | Rename/restructure sidebar; Work list with next-action rows; deprecate Dashboard as default |
| **1.2** | Job stage shell | Campaign detail → stage rail + canvas + context rail; route/query stage state |
| **1.3** | Brief + Send + Decisions stages (v1) | Wire Brief / Send / Decisions stage UIs; human status map; persona-flow doc update |

---

## Sprint 1.1 — Nav & Work home

**Duration:** ~1 week  
**Goal:** One creator home.

### Scope

1. **Sidebar IA**
   - Primary: **Work** (`/app/work` — can alias or replace `/app/campaigns` + default post-login).
   - Keep: Brands, Approved, Settings.
   - Review Queue: visible only for `isReviewerRole` (already gated) — demote visual weight; label **Inbox** if trivial, else leave for P3.
   - Remove or demote **Quick Start** and **Dashboard** from primary nav (redirects OK: `/app/dashboard` → `/app/work`, `/app/quick-start` → new job or Work empty CTA).

2. **Work page**
   - Fraunces page title *Work*.
   - Primary CTA: **New**.
   - Rows/cards: job name, brand chip, **next action** (loudest): e.g. *Add creative*, *Send for approval*, *3 waiting on client*, *Fix 2 notes*.
   - No gen-mix charts or multi-stat collage. Optional single line: open decision count.

3. **Next-action logic** (deterministic helper)
   - Prefer: `changes_requested` count → Fix; else awaiting send (`draft` with assets) → Send; else `submitted`/`brand_review` → Waiting; else no assets → Add creative; else empty job → Complete brief.

### Acceptance

- [ ] New authenticated creator lands on Work (or is redirected there).
- [ ] Quick Start / Dashboard are not equal nav peers.
- [ ] Each Work row exposes exactly one primary next action.
- [ ] Mobile: next action tappable; Work list usable.

### Out of scope

- Guest links, upload parity UI, round diff.

---

## Sprint 1.2 — Job stage shell

**Duration:** ~1 week  
**Goal:** Campaign detail becomes a staged Job workspace.

### Scope

1. **Layout** (per DESIGN.md)
   - Left: **stage rail** (Brief · Creative · Send · Decisions · Approved).
   - Center: **stage canvas**.
   - Right: **context rail** — brand swatches / readiness / tone snippet / brief snippet (read-only v1; reuse BrandPreview / readiness pieces where they exist).

2. **Routing**
   - Prefer `/app/work/:id?stage=creative` (or `/app/campaigns/:id` kept as path with Work labeling — pick one canonical path and redirect the other).
   - Persist last stage per job in URL (shareable).

3. **Creative stage (shell only)**
   - Host existing `GenerationPanel` (and upload entry if already present) inside Creative canvas — full Generate \| Upload parity is **P2**.
   - Stage rail marks Creative complete when ≥1 candidate asset exists.

4. **Header**
   - Job title (Fraunces), brand name, human status summary, primary next action button mirroring Work row logic.

### Acceptance

- [ ] Stage rail navigates all five stages (Creative can render current gen UI).
- [ ] Context rail shows brand + brief context without leaving the job.
- [ ] Deep link to `?stage=` restores the stage.
- [ ] Keyboard / a11y: rail is navigable; current stage announced.

### Out of scope

- Redesigning GenerationPanel internals; guest Decide; compliance-on-Decide.

---

## Sprint 1.3 — Brief, Send, Decisions stages (v1) + language

**Duration:** ~1 week  
**Goal:** Spine usable end-to-end for authenticated brand approvers (existing review routes).

### Scope

1. **Brief stage**
   - Surface existing brief / CCO-lite / incomplete-brief banner in stage canvas (reuse `CampaignBriefStage` / brief forms).
   - CTA: *Continue to Creative* when brief readiness OK (or confirm override for idea-first).

2. **Send stage**
   - Select draft assets (multi).
   - Target: **Internal check** (`agency_review`) vs **Send to client/brand** (`brand_review` via submit API).
   - Optional message.
   - Reuse `SubmitModal` logic / `POST /api/assets/submit` — no client-side status writes.
   - Plain language copy (not org jargon).

3. **Decisions stage**
   - List assets by round/status buckets: Waiting · Changes · Approved · Declined.
   - Click → existing `/app/review/:assetId` for reviewers; creators see read-only detail + notes for `changes_requested`.

4. **Approved stage**
   - Filter this job’s approved assets; link out to global Approved if useful.

5. **Human status map**
   - Shared helper + Badge labels across Work, Job header, Decisions, review chips.

6. **Docs**
   - Update `docs/06-persona-flows/` routes, anchors, and copy for Work / stages.

### Acceptance

- [ ] Creator can Brief → Creative (existing gen) → Send → see Waiting on Decisions without inventing new status APIs.
- [ ] Submit still only via submit API; review still via review API.
- [ ] Status labels match the README language table.
- [ ] Persona-flow docs updated in the same PR.

### Out of scope

- Shareable guest token Decide (P3).
- Round compare UI (P4).
- Elevate Upload to equal Generate chrome (P2).

---

## Technical notes

| Area | Guidance |
|------|----------|
| Routes | Prefer aliasing `/app/work` → campaigns data layer; avoid dual sources of truth |
| State | URL `stage` query; optional zustand for UI-only rail collapse |
| Components | New: `WorkPage`, `JobStageRail`, `JobContextRail`, `JobHeader`, `humanStatusLabel()` |
| Tests | Next-action helper unit tests; stage routing smoke; CampaignDetail migration tests updated |

---

## Design notes

- Work list: **not** a dashboard — one composition, next action dominant.
- Job: dense calm utility; teal only on primary CTAs (New, Send, Continue).
- Amber for waiting / incomplete brief / incomplete brand kit chips.
- No new card chrome unless it aids selection on Send.

---

## Exit criteria (phase)

- [ ] Creators default to Work.
- [ ] Job stage rail is the primary navigation inside a campaign.
- [ ] Authenticated send → decide loop still works via existing review UI.
- [ ] Persona flows reflect new IA.
