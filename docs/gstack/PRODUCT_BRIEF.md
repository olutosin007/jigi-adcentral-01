# Jigi — Product Brief (gstack seed)

**Purpose:** Primary product context for gstack-driven rebuild and improvement. Read this before `/autoplan`, `/spec`, `/design-consultation`, or `/ship` on this repo.

**One-liner:** Brand-grounded creative generation with approval built in — so agencies deliver faster and brands say yes sooner.

---

## What Jigi is set up to achieve

**Jigi** is a brand–agency creative workflow platform: it helps teams go from campaign brief to on-brand creative faster, with human review and approval built in. Agencies (and brands) create campaigns, define briefs, and generate concepts, copy, and images using AI that can be grounded in a brand profile (voice, colours, guidelines) or started from a raw idea when brand assets aren’t ready yet. Generated work lives in campaigns as draft assets, with compliance checks and channel constraints so output stays closer to brand and platform rules.

The second half of the product is **review and approval inside the app**—not scattered across email or Slack. Creators submit assets for agency or brand review; reviewers use a Review Queue and Asset Review screen to approve, reject, or request changes, with status history, comments, in-app notifications, and email nudges. Approved assets are collected for delivery; the goal is to shorten the handoff between “we generated something” and “the brand said yes,” so agencies ship creative sooner and brands get a clear, auditable path from idea to approved asset.

---

## Rebuild / improvement intent

Use this brief when **rebuilding or significantly improving** the app. Priorities:

1. **End-to-end creative loop** — Brief → generate (concept/copy/image) → submit → review → approve → export, without dead ends or bypassed APIs.
2. **In-app review as source of truth** — No Composio/Slack/Notion for MVP; notifications via in-app + Resend only.
3. **Two journeys, one product** — Brand-first (grounded in brand kit) and idea-first (start from seed idea, enrich brand later).
4. **Agency ↔ brand handoff** — Clear roles (creator, reviewer, approver), status model, and queue UX.
5. **Polish where users feel pain** — Generation panel UX, campaign detail, review flow discoverability (e.g. submit from Generated tab, not only All Assets).

Out of scope for initial rebuild pass unless explicitly requested: full DAM, paid ad platform activation, Composio integrations.

---

## Users and roles

| Role | Org | Primary actions |
|------|-----|-----------------|
| Agency Creator | Agency | Campaigns, generate, submit for review |
| Agency Admin | Agency | Team, connected brands |
| Brand Approver | Brand | Review queue, approve/reject/request changes |
| Brand Admin | Brand | Team, approval workflow, brand profile |

---

## Core flows (MVP)

1. **Campaign creation** — Brand + brief + channels; optional seed idea (idea-first).
2. **Generation** — Concepts, copy, images via orchestrated AI (Azure OpenAI, Google Imagen, Replicate, etc.).
3. **Submit for review** — `POST /api/assets/submit` → status history, reviewer notifications, email.
4. **Review** — Review Queue → Asset Review → `POST /api/assets/review` → outcome to creator.
5. **Approved library** — Approved assets per campaign; download/export.

Spec references: `docs/02-creativegen-mvp/`, `docs/JIGI_PROJECT_SPECIFICATION.md`, `docs/02-creativegen-mvp/03-human-review-in-app.md`.

---

## Technical anchor (current codebase)

| Layer | Location |
|-------|----------|
| Main app | `uiux/jigi-app/` |
| Frontend | React 19, Vite, TanStack Query, Zustand, Tailwind, shadcn |
| API | Vercel-style routes under `uiux/jigi-app/api/`; local dev via `pnpm dev:full` (API :3000, Vite :5173) |
| DB / auth | Supabase (migrations in `uiux/jigi-app/supabase/` and repo `supabase/`) |
| Email | Resend (server-side in API routes) |
| AI | `src/lib/ai/` orchestrator + adapters; generation APIs under `api/generate/` |

Local dev:

```bash
cd uiux/jigi-app
cp .env.example .env.local   # configure Supabase + keys
pnpm install
pnpm dev:full
# App: http://localhost:5173  API: http://localhost:3000
```

---

## Suggested gstack workflow for rebuild

1. **Read this file** + skim `docs/JIGI_PROJECT_SPECIFICATION.md` §1–5 and `docs/UI-IMPROVEMENT-PHASES.md`.
2. **`/setup-gbrain`** (optional) — persistent memory across sessions.
3. **`/design-consultation`** or **`/design-review`** — UX direction before large UI refactors.
4. **`/autoplan`** on a written rebuild plan — CEO/design/eng/DX review pipeline.
5. **`/spec`** — file discrete issues (e.g. “unify submit UX on Generated tab”, “review queue role gating”).
6. **`/ship`** — implement and merge with QA.

When spawning agents, attach: **this file** + the specific flow doc (e.g. `03-human-review-in-app.md`) + target screen list from `docs/UI-IMPROVEMENT-PHASES.md`.

---

## Success criteria (rebuild)

- A new user can complete: sign up → campaign → generate asset → submit → reviewer approves → asset appears in Approved — without leaving the app or hitting undocumented steps.
- Review and submit always go through API routes (not direct Supabase status patches from the UI).
- UI reflects status model in `src/lib/status.ts` consistently.
- Generation and review surfaces are discoverable from campaign detail (not hidden behind obscure tabs/menus).
