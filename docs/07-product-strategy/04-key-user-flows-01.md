# Key user flows — outcomes, journeys & onboarding plan

**Audience:** Product · Design · Engineering (agents + humans)  
**Status:** Draft for build — outcomes-based flows & onboarding  
**Version:** 1.0 · November 2026  
**Owner:** Neocept / Jigi  
**Parents:** [PRODUCT_STRATEGY.md](./PRODUCT_STRATEGY.md) · [`docs/gstack/PRODUCT_BRIEF.md`](../gstack/PRODUCT_BRIEF.md) · [`DESIGN.md`](../../DESIGN.md)  
**Shipped baseline:** Handoff OS + Generation Studio + Brand Guardian v1 (strategy Waves 0–5 / [PR #1](https://github.com/Neocept-global/jigi-adcentral/pull/1))

---

## 0. Purpose

Turn the commercial promise — **On-brand drafts. Client yes. Same place.** — into:

1. A complete inventory of user journeys the product can support  
2. A **ranked selection** of the journeys that drive wedge ICP and north-star  
3. A **full plan** for outcome-based flow design and onboarding (not a greenfield rewrite)

**North-star metric (unchanged):** median hours from first candidate asset → first client/brand decision.

**Canonical product spine:**

```text
Brand enough → Candidate (Generate | Upload) → Send → Decide → Rework / Approved
```

This plan **evolves** existing surfaces (`/app/work`, `/app/generate`, campaign detail, submit/review APIs, Guest Decide `/r/:token`, Brand Guardian soft-gate). It does **not** replace in-app review with Slack, rebuild Landing V2, or invent a parallel governance stack.

---

## 1. Personas & roles (who walks which path)

| Persona | Org type | Primary job | Typical entry |
|---------|----------|-------------|----------------|
| **Agency Creator** | Agency | Produce candidates; get a decision | Signup → Agency → Work / Generate |
| **Agency Admin** | Agency | Multi-brand ops; team | Settings / Brands |
| **Brand Approver** | Brand (or guest) | Say yes / changes with brand confidence | Guest Decide link or `/app/review` |
| **Brand Admin** | Brand | Kit as system of record; invite agencies | Brand profile / invites |
| **Partner / BD** | External | Refer mid-market clients | Partner one-pager → pilot |

Roles already encoded: creator / reviewer / approver; Guest Decide strips prompts/providers.

---

## 2. Full journey inventory

Use cases the product should eventually support. **Priority** = wedge relevance for onboarding + outcomes work in this doc.

| ID | Journey | Actor | Outcome (user language) | Priority |
|----|---------|-------|-------------------------|----------|
| J01 | Signup → org setup → journey choice | Any | “I’m set up as Agency or Brand, brand-first or idea-first” | Supporting |
| J02 | Pricing → Start free | Prospect | “I understand packaging and can start” | Supporting |
| J03 | Landing → first loop demo | Prospect | “I can see draft → decide in one place” | Supporting |
| **J04** | **Brand-first create → Guest Decide → approved** | Agency Creator | “On-brand candidates; client yes recorded” | **Primary (Flow A)** |
| **J05** | **Idea-first / Generate now → brand later → Decide** | Agency Creator | “I started fast; still got a clean decision” | **Primary (Flow A branch)** |
| J06 | Upload-first handoff (no gen) | Agency Creator | “Existing files get a Decide link + trail” | High (parity) |
| J07 | Remix / upscale / aspect variants → re-submit | Agency Creator | “More variants without losing the loop” | Medium |
| J08 | Rework after “request changes” | Agency Creator | “New round, same Decide thread” | High |
| J09 | Multi-brand studio ops | Agency Admin/Creator | “Switch brands; same handoff habit” | Medium |
| J10 | Prove the yes (approved library + audit) | Agency / Brand | “This is the approved file; here’s who said yes” | High |
| **J11** | **Guest Decide (no account)** | Brand Approver | “I decided in &lt;3 clicks; brand check visible” | **Primary (Flow B)** |
| J12 | Logged-in brand review queue | Brand Approver | “My inbox of decisions” | High |
| J13 | Brand kit as system of record | Brand Admin | “Guidelines gate work before I see it” | High |
| J14 | Invite / connect agency | Brand Admin | “One place for agencies to submit” | Medium |
| J15 | Team & settings / guided tour replay | Admin | “I can replay the product story” | Supporting |
| J16 | Partner referral → pilot | Partner | “Client enters Flow A+B” | Later / GTM |

**Explicit non-journeys (year one — do not onboard into):** full DAM, ad-account publishing, Slack/Teams as approval source of truth, Fortune-100 MLR suites, media/identity graphs.

---

## 3. Selection — top 2 journeys

### Why these two

| Criterion | Flow A (Agency ship decision) | Flow B (Brand / guest yes) |
|-----------|-------------------------------|----------------------------|
| ICP wedge | Primary agency studio | Dual-sided retention (brand decides) |
| Strategy demo gate | Full loop in &lt;10 min | Decide moment in same session |
| North-star | Owns candidate → decision clock | Produces the decision event |
| Differentiator | Gen/upload + Brand Guardian + handoff | Filestage-grade decide + brand confidence |
| Onboarding leverage | Hero activation path | Complementary “open the link you just sent” |

**Hero pair for activation:** A creates and sends; B decides. Together they prove the promise in one session.

---

## 4. Flow A — Agency: “Ship a decision, not a folder”

### 4.1 Outcome statement

> As an agency creator, I can produce an on-brand (or idea-first) candidate, run Brand Guardian, send a Guest Decide link, and get an unambiguous client decision — without Slack archaeology.

**Success when:** first Guest Decide link sent and at least one `decision_made` event within the activation window (target: same session for demo; ≤48h for pilot).

### 4.2 Actors & systems of record

- **Actor:** Agency Creator (logged in)  
- **Systems of record:** `POST /api/assets/submit`, review-link / Guest Decide token, status history — **never** client-side status writes for handoff  
- **Soft systems:** Brand Guardian checklist / soft-gate (warn + confirm; never hard-block submit API)

### 4.3 Happy path (step map)

| Step | User intent | Surface (today) | Outcome signal |
|------|-------------|-----------------|----------------|
| A0 | Create account / org as Agency | `/signup` → `/setup/organisation` | Org type = agency |
| A1 | Choose how to start | `/setup/journey` | `brand_first` or `idea_first` |
| A2a | **Brand-first:** put guidelines in | `/app/brands`, Brand profile | Kit level usable for checks |
| A2b | **Idea-first:** skip to create | `/app/generate` or campaign + seed | Candidate without full kit |
| A3 | Produce candidate | Generate panel / Upload | Asset in draft; `candidate_created` |
| A4 | See brand confidence | Brand check badge / OnBrandCheck | Checklist visible |
| A5 | Soft-gate on submit | Submit modal | Confirm if fail; warn toast; submit via API |
| A6 | Share Decide | Send / link copy | Guest URL `/r/:token` |
| A7 | Wait with human language | Work / job stages | “Waiting on client” (Honey) |
| A8 | Receive decision | Notifications / status | Approved or changes; round history |
| A9 | Delivery or rework | Approved library / new round | Clear “this is the yes” or J08 |

### 4.4 Branches

| Branch | Trigger | Behaviour |
|--------|---------|-----------|
| Brand-first | Journey choice / complete kit | Orchid semantics; checks richer |
| Idea-first | Journey choice / Generate now | Clay semantics; enrichment later; still full handoff |
| Upload-only | No generation | Same submit → Decide (J06) |
| Guardian fail | Checklist fail | Confirm dialog; do not skip submit API |
| Guardian warn | Checklist warn | Toast; allow submit |
| No client account | Client won’t sign up | Guest Decide only (Flow B) |

### 4.5 Empty states & copy (outcome-oriented)

Align with strategy tagline already in product; deepen for onboarding:

| Moment | Message direction |
|--------|-------------------|
| Work empty | “On-brand drafts. Client yes. Same place.” + CTA Generate or New campaign |
| Brands incomplete | “Put guidelines in once — they gate work before clients see it” |
| After first candidate | “Ready to send? Brand check sits beside the asset.” |
| After submit | “Share the Decide link — that’s the decision, not a folder.” |

Typography/colour: `PageTitle` / Orchid actions / Honey pending — see `DESIGN.md`.

### 4.6 Analytics (already partially shipped Wave 4)

| Event | When | Properties (min) |
|-------|------|------------------|
| `candidate_created` | Generate/upload complete | `asset_id`, `source` (generate\|upload), `journey` |
| `submitted` | Submit API success | `asset_id`, `has_guardian_fail`, `has_guardian_warn` |
| `decide_link_created` | Review link minted | `asset_id` |
| `decision_made` | Review API (guest or logged-in) | `action`, `round`, `hours_to_decision`, `decide_via` |

**Activation funnel:** A0 → A3 → A5 → A6 → (B decides) → A8.

### 4.7 Gaps vs shipped product (plan items — not revolution)

| Gap | Intent | Notes |
|-----|--------|-------|
| First-run checklist / checklist progress | Guide A0–A6 without a tour wall | Prefer persistent checklist over modal spam |
| “Send Decide” as single primary CTA after submit | One primary action | Match DESIGN.md |
| Idea-first → brand enrichment nudge | Close Clay → Orchid loop | Soft; never block Decide |
| Demo seed brand (optional) | &lt;10 min demo without empty kit | Feature-flagged; not fake production data |

---

## 5. Flow B — Brand / client: “Yes with confidence”

### 5.1 Outcome statement

> As a brand approver (often without an account), I can open a Decide link, see the creative and brand check, and approve or request changes in under three primary clicks — with an audit trail the agency can prove.

**Success when:** guest or logged-in reviewer completes Approve / Changes / Decline; `decision_made` fires; creator sees human-readable status.

### 5.2 Actors & systems of record

- **Actor:** Brand Approver (guest via `/r/:token` or logged-in `/app/review`)  
- **Systems of record:** `POST /api/assets/review`; rounds / comments; Brand Guardian summary on Decide  
- **Privacy:** Guest UI strips prompts, providers, internal cost metadata

### 5.3 Happy path (Guest Decide — primary)

| Step | User intent | Surface | Outcome signal |
|------|-------------|---------|----------------|
| B0 | Open link from agency | `/r/:token` | Valid token; asset loads |
| B1 | Understand ask | Eyebrow / title | “Needs your decision” |
| B2 | View creative asset-first | Hero asset ≥60% | Asset is the hero |
| B3 | Trust brand gate | OnBrandCheck / Brand Guardian | Pass/warn/fail readable |
| B4 | Decide | Approve / Changes / Decline | One primary action group |
| B5 | If changes | Notes required | Cannot request changes blank |
| B6 | Confirmation | Recorded decision state | No double-submit confusion |
| B7 | Agency notified | Email + in-app | Creator continues A8/A9 |

### 5.4 Branches

| Branch | Trigger | Behaviour |
|--------|---------|-----------|
| Logged-in brand | User has brand org | `/app/review` queue → same decide semantics |
| Already decided | Revisit link | Show recorded decision; no silent overwrite |
| Round &gt; 1 | Rework | Compare / “what changed” where shipped |
| Expired / revoked link | Bad token | Clear dead-end; ask agency to resend |

### 5.5 Empty / error copy direction

| Moment | Message direction |
|--------|-------------------|
| Invalid token | “This link isn’t active. Ask your agency for a new Decide link.” |
| Brand check fail visible | “Flagged for brand — still your call.” (curative, not auto-reject) |
| After approve | “Approved — your team has a clear yes.” (Sage) |

### 5.6 Analytics

Reuse `decide_opened`, `decision_made` (Wave 4 / GuestDecide tests). Add if missing: time-to-decision from link open → action (guest UX quality).

### 5.7 Gaps vs shipped product

| Gap | Intent |
|-----|--------|
| First-time guest microcopy for Brand Guardian | Teach “machine check beside human yes” in one sentence |
| Mobile Decide polish | Guest often on phone |
| Post-decision CTA for brand to create account (optional) | Dual-sided network — soft, not forced |

---

## 6. Coupled activation — A + B in one session (demo / onboarding spine)

This is the **GTM and onboarding spine**. If it is not demoable in under ten minutes, GTM waits (strategy §9).

```text
[Agency] Signup → Generate or Upload → Brand Guardian → Submit
       → copy Guest Decide URL
[Brand]  Open URL → Approve (or Changes)
[Agency] See approved / waiting-on-rework
```

**Onboarding product principle:** Do not teach the whole app. Teach **send a Decide link** and **open a Decide link**.

---

## 7. Outcomes-based onboarding plan

### 7.1 Jobs onboarding must accomplish

1. Establish org type (Agency vs Brand) without confusion  
2. Establish journey mode (brand-first vs idea-first) with Clay/Orchid semantics  
3. Drive **first candidate** within session  
4. Drive **first submit + Decide link** within session  
5. Optionally drive **first decision** (same browser / second device / teammate)  
6. Leave a replayable tour for later (Settings already has tour entry)

### 7.2 Proposed onboarding layers

| Layer | What | When | Guardrail |
|-------|------|------|-----------|
| **L0 Setup** | Org + journey choice | First login | Keep existing `/setup/*`; tighten copy only |
| **L1 Activation checklist** | 4–5 outcome ticks: Brand (optional) → Candidate → Brand check seen → Decide link sent → Decision received | Work home / Generate | Dismissible; not a modal gauntlet |
| **L2 Contextual tips** | One tip per surface (Generate, Submit, Decide) | First visit per surface | DESIGN.md: one primary action; no sticker spam on hero |
| **L3 Guided tour** | Existing tour; align steps to Flow A+B | Manual / Settings replay | Update step copy to Decide language |
| **L4 Empty states** | Outcome CTAs | Always | Strategy copy already started Wave 1 — deepen |

### 7.3 Activation checklist (suggested ticks)

1. **Start a draft** — Generate now or upload into a job/campaign  
2. **See Brand check** — Badge / panel appeared at least once  
3. **Send for a decision** — Submit + copy Guest Decide link  
4. **Get a yes (or changes)** — First `decision_made` (can be self-test with second browser)  
5. *(Optional)* **Put guidelines in** — Brand kit level ≥ threshold (brand-first users; idea-first can defer)

### 7.4 What onboarding must not do

- Force brand kit before idea-first users can generate  
- Hard-block submit on Brand Guardian fail  
- Require client signup before Decide  
- Teach pricing, partners, or video scaffold in first run  
- Cover every journey in §2  

---

## 8. UX / design constraints (non-negotiable)

From `DESIGN.md` + strategy §12:

- **Asset-first** at Decide — creative hero, chrome quiet  
- **Human language** for status — “Waiting on client,” not codes  
- **One primary action** per view  
- **Brand confidence** visible next to asset  
- Tokens: Orchid (action) · Sage (approved) · Clay (idea-first) · Honey (waiting)  
- Krona One only via `PageTitle` / display ≥20px, never bold  

---

## 9. Implementation plan (evolutionary waves)

Sequencing for agents after product approval of **this** doc. Prefer minimal diffs under `uiux/jigi-app/src/`.

### Wave F0 — Spec lock & instrumentation audit

| Ticket | Work | Acceptance |
|--------|------|------------|
| F0.1 | Map checklist ticks → existing analytics events; gap list | Table in PR / this doc §4.6–5.6 updated |
| F0.2 | Audit empty states for Work, Generate, Brands, GuestDecide vs §4.5 / §5.5 | Diff list only |
| F0.3 | Confirm submit/review still only via APIs | Tests green |

### Wave F1 — Flow A activation surfaces

| Ticket | Work | Acceptance |
|--------|------|------------|
| F1.1 | Work-home activation checklist (L1) wired to real progress | Ticks persist per user/org; DESIGN.md |
| F1.2 | Post-submit primary CTA: “Copy Decide link” / “Open Decide preview” | One primary action |
| F1.3 | Idea-first enrichment nudge (non-blocking) | Clay → brand CTA; no hard gate |
| F1.4 | Copy/tests for A empty states | String tests updated |

### Wave F2 — Flow B Decide clarity

| Ticket | Work | Acceptance |
|--------|------|------------|
| F2.1 | Guest Decide eyebrow + Brand Guardian one-liner | Guest still strips secrets |
| F2.2 | Mobile layout pass for `/r/:token` | Usable at 390px width |
| F2.3 | Invalid/expired token empty state | Clear recovery copy |
| F2.4 | GuestDecide tests for new copy / a11y | Green |

### Wave F3 — Coupled demo / tour alignment

| Ticket | Work | Acceptance |
|--------|------|------------|
| F3.1 | Align guided tour steps to A+B spine | Settings replay works |
| F3.2 | Optional demo seed brand behind flag | Off by default |
| F3.3 | Document 10-minute demo script in this folder or GTM note | &lt;10 min path written |

### Wave F4 — Measure & harden

| Ticket | Work | Acceptance |
|--------|------|------------|
| F4.1 | Funnel dashboard or admin stub: checklist completion → Decide sent → decision | Dev/admin only OK |
| F4.2 | Regression: Guest Decide, submit, Brand Guardian soft-gate | `pnpm test` + `pnpm test:server-api` |
| F4.3 | Update Delivery Log in this file | Status → Implemented |

**Out of scope for F-waves:** DAM, publishing, Slack SoT, Landing V2 rebuild, hard-block submit, video UI.

---

## 10. Success metrics

| Metric | Target (activation) | Target (pilot 30d) |
|--------|---------------------|--------------------|
| % new agency orgs completing checklist ticks 1–3 | ≥60% in 7 days | — |
| Median hours candidate → first decision | Demo: minutes | Pilot: ↓ vs baseline |
| % first submissions with Decide link created | ≥70% of submitters | — |
| Guest Decide completion rate (open → decide) | ≥50% | ↑ |
| First-pass approval rate | Instrument | ↑ over pilot |
| Creator / approver NPS | — | Quarterly |

---

## 11. Open questions (resolve before F1 build)

1. **Checklist persistence:** per-user vs per-org? (Default: per-user.)  
2. **Self-decide for demo:** allow agency to open Guest Decide as “client” for activation tick 4, or require second party only? (Default: allow self-open for activation; label as practice.)  
3. **Demo seed brand:** ship behind flag in F3 or defer? (Default: defer unless demo gate fails without it.)  
4. **Brand org first-run:** separate checklist emphasizing kit + invite vs Agency checklist? (Default: lighter brand checklist — kit + open first Decide.)  

---

## 12. Approval gate

Reply with one of:

| Reply | Meaning |
|-------|---------|
| **`APPROVE FLOWS AS WRITTEN`** | Agents may implement Waves F0–F4 with defaults in §11 |
| **`APPROVE WITH EDITS:`** + bullets | Apply edits, then implement |
| **`HOLD`** | Docs only; no flow/onboarding build |

Until approval, agents may only edit this folder’s docs if asked.

---

## 13. Delivery Log

| Item | Status | Notes |
|------|--------|-------|
| Journey inventory | Done | §2 |
| Top-2 selection | Done | Flow A + Flow B |
| Outcomes + step maps | Done | §4–§5 |
| Onboarding layers | Done | §7 |
| Engineering waves F0–F4 | **Implemented** | Approved 2026-11-06 (`APPROVE FLOWS AS WRITTEN`); §11 defaults |
| F0 Instrumentation | Done | Analytics → activation ticks; submit/review APIs unchanged |
| F1 Activation surfaces | Done | Work checklist · Share Decide CTAs · GenerateNow nudge |
| F2 Guest Decide | Done | Eyebrow · Brand Guardian one-liner · mobile padding · expired/invalid copy |
| F3 Tour + demo | Done | Tour A+B spine · [DEMO_SCRIPT_10MIN.md](./DEMO_SCRIPT_10MIN.md); seed brand deferred |
| F4 Funnel + tests | Done | Settings DEV funnel stub · regression tests |

---

*Document classification: internal product/engineering plan. Commercial narrative remains PRODUCT_STRATEGY.md. Engineering seed: PRODUCT_BRIEF.md. Design law: DESIGN.md.*
