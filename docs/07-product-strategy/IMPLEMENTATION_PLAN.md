# Jigi — Agent Implementation Plan

**Purpose:** Single executable plan for Cursor agents after **one human approval**.  
**Audience:** Cursor / gstack agents (primary) · Product owner (approval only)  
**Status:** Approved as written · Executing  
**Version:** 1.0 · October 2026  
**Strategy source:** [PRODUCT_STRATEGY.md](./PRODUCT_STRATEGY.md)  
**Product seed:** [`docs/gstack/PRODUCT_BRIEF.md`](../gstack/PRODUCT_BRIEF.md)  
**Design law:** [`DESIGN.md`](../../DESIGN.md) — Orchid/Sage/Krona One; do not invent palette  

---

## 0. Approval gate (human — once)

Reply with exactly one of:

| Reply | Meaning |
|-------|---------|
| **`APPROVE PLAN AS WRITTEN`** | Agents execute Waves 0–5 with the Decision Defaults in §2. No further product questions unless a Stop Condition fires. |
| **`APPROVE WITH EDITS:`** + bullets | Agents apply listed edits to this file, then execute. |
| **`HOLD`** | Do not implement. |

Until approval, agents may only edit this folder’s docs if asked.

---

## 1. Autonomy contract (95–100%)

### Agents MUST

1. Read this plan + `PRODUCT_BRIEF.md` + `DESIGN.md` before coding.  
2. Work in order: **Wave 0 → 1 → 2 → 3 → 4 → 5** (sub-tickets sequential within a wave unless marked parallel).  
3. Prefer minimal diffs; match existing patterns under `uiux/jigi-app/src/` and `server/api/`.  
4. Use `POST /api/assets/submit` and `POST /api/assets/review` — never client-side status writes for handoff.  
5. Add/adjust unit tests with every behavioural change; keep drift guards green.  
6. Run after each wave (from `uiux/jigi-app/`):  
   - `pnpm test`  
   - `pnpm test:server-api`  
   - `npx tsc -p tsconfig.json --noEmit`  
7. Commit only when the user later asks, or when this plan’s wave says `COMMIT:` and approval already includes commits — **default: do not commit unless user says so after approval.**  
   - *Decision Default D-COMMIT:* After approval, agents **do commit** at the end of each completed Wave with message format below.  
8. Update this file’s **Delivery Log** table as waves finish.  
9. Never print secrets from `.env.local`.  

### Agents MUST NOT

- Ask the product owner for preference among Decision Defaults (§2).  
- Change pricing copy inventively beyond §4 Wave 5 copy blocks.  
- Expand into DAM, ad-account publishing, Slack as source of truth, or Composio.  
- Rewrite DESIGN.md colours/fonts without an explicit new approval.  
- Force-push, amend others’ commits, or skip hooks.  

### Stop Conditions (pause and ask human)

Only if one of these is true:

1. Missing production credentials that block a wave’s acceptance (e.g. `FAL_KEY` required for Wave 2 live smoke and not in env).  
2. Migration cannot apply without destructive data loss.  
3. A dependency license or ToS blocks commercial use of a chosen model.  
4. Tests reveal a product contradiction with `PRODUCT_STRATEGY.md` that Decision Defaults do not resolve.  

Otherwise: choose the Decision Default and continue.

---

## 2. Decision Defaults (no human ping)

| ID | Decision | Default |
|----|----------|---------|
| D-ENGINE | Primary open-weight / long-tail / video-ready substrate | **fal.ai** as new provider `fal`; Replicate remains fallback; keep Google Gemini + Kling as direct when keys present |
| D-LINEUP | Image tier defaults when fal configured | Draft: Flux Schnell (or fal equivalent) · Refine: Seedream 4 · Final: keep Nano Banana via Google if key, else fal Nano Banana / best available · Upscale: Real-ESRGAN on fal or Replicate |
| D-ROUTER | Chain order | Kling → Google Gemini → **fal** → Azure Foundry → Replicate → Azure OpenAI (skip missing creds) |
| D-GOVERNANCE | Brand check depth Wave 3 | **Evolve** OnBrandCheck/checklist/compliance; gap-fill palette + voice keywords; soft-gate (**warn**/confirm) on submit; do not hard-block; do not fork a second panel |
| D-GUEST | Guest Decide | Keep existing guest routes; polish only if Wave 4 finds regressions |
| D-VIDEO | Video | Scaffold jobs table + fal/Kling i2v stub behind feature flag `VIDEO_ENABLED=false`; no UI ship until Wave 5 optional |
| D-COMMERCIAL | Public pricing page | Static page `/pricing` with Studio / Agency / Brand tiers; amounts as **placeholders** `$X` until human replaces — use copy in §Wave 5 |
| D-LANDING | Marketing landing | Keep Landing V2; add strategy-aligned hero/CTA pointing to signup + `/pricing`; do not rebuild whole landing |
| D-BRANCH | Git branch | `feat/strategy-execution` from current HEAD (create if missing) |
| D-COMMIT | Commits | One commit per completed Wave on that branch |
| D-TESTS | Coverage bar | New modules ≥ same density as Generation Studio phases; no new hard-coded teal/amber hex (design drift tests) |
| D-DOCS | Doc updates | Update Generation Studio README decisions log when fal lands; link strategy from PRODUCT_BRIEF |

---

## 3. Current state — evolution baseline (do not re-build)

**Stance:** This plan is an **evolution** of a working handoff + studio product, not a revolution. Agents that rewrite Handoff OS, Decide, or compliance from scratch are off-plan.

Verified in repo (Oct 2026 audit):

| Area | Status | Location / notes |
|------|--------|------------------|
| Handoff OS P1–P4 | **Shipped** (merged) | Work stages, upload parity, guest Decide, rounds, compliance-on-Decide — `docs/04-feature-additions/02-handoff-os/` |
| Generation Studio P1–P4 | **Shipped on lineage** | Engine, upscale, TierPicker, presets, `/app/generate` — commits through `dc9e426`; confirm on working branch before Wave 2 |
| Design system | **Shipped** | Orchid/Sage, Krona One, `/app/design-system` (`feat/design-system` / `0721253`) |
| Brand confidence (Decide) | **Shipped — evolve** | `OnBrandCheckPanel`, `buildBrandChecklist`, `compliance_check`, colour compliance UI — **Wave 3 extends these; does not invent a parallel stack** |
| Image enforcement / validation | **Shipped — reuse** | `src/lib/image-enforcement/`, validation pipeline, orchestrator colour_compliance |
| Submit/review APIs | **Shipped** | Mandatory path — never bypass |
| Image router | **Shipped — evolve** | Kling → Gemini → Foundry → Replicate → Azure; Wave 2 inserts **fal** |
| Pricing page | **Missing** | Wave 5 adds `/pricing` |
| fal provider | **Missing** | Wave 2 |
| Video jobs | **Deferred notes only** | Wave 5 scaffold only (`VIDEO_ENABLED=false`) |
| North-star analytics | **Partial** | Wave 4 instruments candidate→decision |

Agents: run `git branch --show-current` and `git log --oneline -15` at start. Working branch after approval: `feat/strategy-execution` from current HEAD (includes design-system + studio lineage if HEAD already has those commits). If Generation Studio commits are missing, merge/cherry-pick before Wave 2 (Stop Condition if conflicts &gt; 30 minutes).

### Revolution vs evolution map

| Wave | Mode | Why |
|------|------|-----|
| 0 | Chore | Docs / branch |
| 1 | Evolution | Narrative copy on existing screens |
| 2 | Evolution | New provider in **existing** router |
| 3 | Evolution | Productise & soft-gate **existing** OnBrandCheck / compliance |
| 4 | Evolution | Metrics + regression |
| 5 | Evolution + small new surface | Pricing/landing CTAs; video **scaffold only** |

**Out of bounds (would be revolution — refuse):** replacing guest Decide; moving approvals to Slack; rebuilding Landing V2; swapping DESIGN.md; hard-blocking all submits; ComfyUI GPU fleet as default engine.

---

## 4. Waves

### Wave 0 — Repo readiness (½ day)

| Ticket | Work | Acceptance |
|--------|------|------------|
| W0.1 | Create branch `feat/strategy-execution` | Branch exists |
| W0.2 | Link docs: add Strategy section to `docs/gstack/PRODUCT_BRIEF.md` pointing to `docs/07-product-strategy/` | Brief links both docs |
| W0.3 | Add `docs/07-product-strategy/README.md` index | Index lists strategy + plan + approval status |
| W0.4 | Baseline green | `pnpm test` + `pnpm test:server-api` + tsc pass |

**COMMIT:** `chore: strategy execution branch + doc links (Wave 0)`

---

### Wave 1 — Strategy surfaces in-product (IA & messaging)

Align the product copy and empty states with the commercial narrative without new backend.

| Ticket | Work | Files (expected) | Acceptance |
|--------|------|------------------|------------|
| W1.1 | App empty states / Work home eyebrow: “On-brand drafts. Client yes. Same place.” where a product tagline fits without clutter | `src/pages/Work.tsx`, empty-state usages | Copy present; DESIGN.md typography |
| W1.2 | Generate now page supporting line mentions brand kit *or* idea-first | `src/pages/GenerateNow.tsx` | Dual journey language |
| W1.3 | Decide / review chrome: reinforce “Needs your decision” / audit friendliness — no status machine change | review / guest decide copy only | Tests updated if string assertions exist |
| W1.4 | Settings or Brands empty CTA: “Put guidelines in once — they gate work before clients see it” | Brands empty / brand profile incomplete banners | Uses Clay/Honey/Orchid tokens not raw hex |

**Tests:** Update any snapshot/string tests; add 1–2 copy presence tests if none.  
**COMMIT:** `feat(copy): align in-app narrative with product strategy (Wave 1)`

---

### Wave 2 — Generation engine: fal provider lane

Rebuild the long-tail / open-weight path onto fal per strategy recommendation. Keep router contract.

| Ticket | Work | Files (expected) | Acceptance |
|--------|------|------------------|------------|
| W2.1 | Add `fal` to `ImageProvider` union + migration CHECK (follow pattern `035_image_providers_*.sql`) | `image-models.ts`, new migration `037_image_provider_fal.sql` (next free number — **verify**), provider constraint test | Migration parses; union == CHECK |
| W2.2 | `server/api/lib/fal.ts` — create prediction / queue + poll (mirror replicate reliability pattern); env `FAL_KEY`; never log key | `fal.ts`, `fal.test.ts` | Unit tests with mocked fetch |
| W2.3 | `buildReplicateImageInput`-style `buildFalImageInput` per model family; drift test on aspect enums | fal input builder tests | Same aspects as app catalog |
| W2.4 | Wire `generate/image.ts` fal branch; content-type from URL | `generate/image.ts` | Sanity test success path |
| W2.5 | Insert fal in `buildRouteChain` per D-ROUTER; update DEFAULT lineup helpers; registry prices (estimates OK if marked) | `image-routing.ts`, tests | Chain order tests green |
| W2.6 | Health / settings: show fal configured like other providers | health endpoint if exists | No secrets leaked |
| W2.7 | Docs: Generation Studio README decision row for fal | `docs/04-feature-additions/03-generation-studio/README.md` | Decision logged |
| W2.8 | Live smoke **only if** `FAL_KEY` in `.env.local` | script under `scripts/` deleted after OR kept as `scripts/smoke-fal.mjs` without printing key | If no key: skip live smoke, note in Delivery Log — **not** a Stop Condition |

**COMMIT:** `feat(images): add fal.ai provider lane to image router (Wave 2)`

---

### Wave 3 — Brand Guardian v1 (**evolve** existing governance)

Productise what already ships: `OnBrandCheckPanel`, `buildBrandChecklist`, `compliance_check`, colour compliance, validation scores. Soft-gate on submit. **Do not** create a parallel UI that ignores Decide.

| Ticket | Work | Files (expected) | Acceptance |
|--------|------|------------------|------------|
| W3.1 | Inventory + thin façade: `src/lib/brand-governance/` wraps/re-exports checklist + score helpers; `runBrandAudit` **calls** existing image-enforcement / compliance paths where possible | façade + tests | No duplicate scoring logic for palette if enforcement already returns scores |
| W3.2 | Gap-fill palette: only if colour path missing for a type — reuse orchestrator / image-enforcement; map to pass/warn/fail already used by checklist | extend existing, don’t fork | Fixtures green |
| W3.3 | Gap-fill copy voice: preferred/avoided words from brand profile into checklist items; `BRAND_AUDIT_LLM=false` default | handoff checklist + tests | Keyword path; no LLM in CI |
| W3.4 | Persist: prefer existing `compliance_check` / `validation_scores` / `content.colour_compliance`; add `content.brand_guardian` summary only if needed for UI | submit + generate writers | One source of truth visible to `buildBrandChecklist` |
| W3.5 | Ensure audit refreshed on generate complete + on submit | existing API routes | Submit succeeds on warn |
| W3.6 | UI: badge/label “Brand check” on cards feeding **existing** `OnBrandCheckPanel` (creator + guest); no second panel | ImageCard / Decide / sidebar | Guest still strips prompts/providers |
| W3.7 | Pre-submit soft-gate: if checklist has fail, confirm dialog; warn toast on warn; **never** skip `POST /api/assets/submit` | submit modal / GenerationPanel | Test for confirm path |
| W3.8 | Name in product copy: “Brand Guardian” in empty states / Decide eyebrow where appropriate; PRD07 → Implemented (v1 evolved) | copy + feature bank | Status updated |

**COMMIT:** `feat(governance): Brand Guardian v1 — evolve OnBrandCheck soft-gate (Wave 3)`

---

### Wave 4 — Handoff reliability & north-star instrumentation

| Ticket | Work | Acceptance |
|--------|------|------------|
| W4.1 | Analytics events (existing analytics helper if any): `candidate_created`, `submitted`, `decision_made` with timestamps | Events fired in tests via mock |
| W4.2 | Admin/dev-only metric stub: median hours candidate→decision query helper (SQL or TS on status history) | Unit test with fixture history |
| W4.3 | Regression pass: guest Decide, submit, review APIs — fix any breakage from Wave 3 | All related tests green |
| W4.4 | Ensure StatusBadge / handoff tones still map via design tokens (Honey pending, Clay idea-first) | drift tests green |

**COMMIT:** `feat(handoff): north-star instrumentation + governance regression fixes (Wave 4)`

---

### Wave 5 — Commercial surfaces + video scaffold

| Ticket | Work | Acceptance |
|--------|------|------------|
| W5.1 | Route `/pricing` — client-facing tiers Studio / Agency / Brand with **placeholder prices** `$49 / $199 / $399` per month and bullet features from strategy §8; CTA to `/signup` | Page renders; mobile OK; DESIGN.md |
| W5.2 | Landing V2: one hero supporting sentence + CTA “See pricing” / “Start free” aligned to strategy; do not redesign whole landing | Diff limited |
| W5.3 | Footer or nav link Pricing for logged-out | Link works |
| W5.4 | Video scaffold: `generation_jobs` migration + types + `VIDEO_ENABLED` false; stub `server/api/generate/video.ts` returning 501; registry note | Tests for flag off; no UI entry |
| W5.5 | Partner one-pager markdown already in strategy — add `docs/07-product-strategy/PARTNER_ONEPAGER.md` 1-page extract for BD | File exists |
| W5.6 | Update Delivery Log + mark plan status **Executed through Wave 5** | This file updated |

**Copy block for pricing (use verbatim):**

- **Studio** — For freelancers & small teams · 2 brands · core handoff · generation credits included  
- **Agency** — Multi-brand · Guest Decide · Brand Guardian · higher credits · priority support  
- **Brand** — Approver seats · audit export · invite agencies · Brand Guardian  

Disclaimer line: “Generation compute may be metered. Prices indicative pending launch.”

**COMMIT:** `feat(commercial): pricing page, landing CTAs, video job scaffold (Wave 5)`

---

## 5. Cross-cutting engineering rules

1. **DESIGN.md** — Orchid primary actions; Sage/Forest success; Clay idea-first; Honey pending; Brick destructive; Krona One titles via `PageTitle` only ≥20px, never bold.  
2. **Imports** — Prefer `@/design-system` for new UI; shadcn OK if already used in file.  
3. **Env** — Document new keys in `.env.example` only (never commit secrets).  
4. **Migrations** — Idempotent CHECKs; next number after inspecting `supabase/migrations/` and `uiux/jigi-app/supabase/migrations/`. Prefer app migrations folder consistent with recent work (`035`/`036` pattern).  
5. **Tests** — Name files `*.test.ts(x)` beside modules; server tests via `pnpm test:server-api`.  

---

## 6. Out of scope (explicit)

Full DAM · Meta/Google ads publish · Slack/Teams as approval source of truth · Composio · replacing Landing V2 entirely · dark studio surface (needs separate DESIGN approval) · hard-blocking submit on brand fail · training custom Firefly models · building ComfyUI GPU fleet  

---

## 7. Definition of Done (whole plan)

- [ ] Waves 0–5 committed on `feat/strategy-execution`  
- [ ] `pnpm test` + `pnpm test:server-api` + tsc green  
- [ ] fal provider in router (live smoke optional)  
- [ ] Brand Guardian v1 visible on assets / Decide (soft-gate)  
- [ ] `/pricing` live in app router  
- [ ] PRODUCT_STRATEGY remains the external narrative; this plan Delivery Log complete  
- [ ] Open PR **only if** user asks after execution  

---

## 8. Delivery Log

| Wave | Status | Commit | Notes |
|------|--------|--------|-------|
| 0 | Done | `b73fdc9` | Baseline 475 + 134 tests green; branch `feat/strategy-execution` |
| 1 | Done | `e68dc49` | Strategy copy on Work, Generate now, Brands, Decide |

| 2 | Done | `4661468` | Live smoke skipped (no FAL_KEY); 141 server tests |
| 3 | Done | `85ad991` | Brand Guardian soft-gate; PRD07 Implemented (v1 evolved) |
| 4 | Done | | North-star events + decision latency stub; GuestDecide green |
| 5 | Pending | | |

---

## 9. Agent kickoff prompt (paste after approval)

```text
Execute docs/07-product-strategy/IMPLEMENTATION_PLAN.md.
Human reply was: APPROVE PLAN AS WRITTEN
Follow Decision Defaults. Do not ask preference questions.
Start at Wave 0. After each wave: tests + commit per D-COMMIT.
Update Delivery Log. Stop only on Stop Conditions.
```

---

*End of plan. Human action required: §0 Approval gate.*
