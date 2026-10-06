# 02 — Handoff OS

**Status:** Implemented (P1–P4 merged, October 2026) — see [DEMO.md](./DEMO.md)  
**Version:** 1.0  
**Created:** October 2026  
**Design system:** [`DESIGN.md`](../../../DESIGN.md) (refined utilitarian — asset-first review, teal decide, amber pending)  
**Product seed:** [`docs/gstack/PRODUCT_BRIEF.md`](../../gstack/PRODUCT_BRIEF.md)

---

## One-liner

**On-brand drafts. Client yes. Same place.**

Jigi becomes a **proofing room with brand memory**: generate *or* upload candidates, send for approval, and get a decision — with Filestage-grade decide UX and Typeface/GenStudio-grade brand confidence on the decision screen.

---

## Why this initiative

Competitive rethink (Typeface · Adobe GenStudio · Filestage) + journey redesign concluded:

1. Open the **decision loop** to work made elsewhere (upload = first-class).
2. **Simplify** IA and workflows to one spine.
3. Add the missing distinctives: **guest/client Decide** + **brand confidence on Decide**.

Upload plumbing largely exists (`source: 'ai' | 'uploaded'`, `UploadModal`, storage). This initiative **repositions** the product around the handoff, not a denser generation suite.

### North-star metric

`median hours from first candidate asset → first client/brand decision`

Secondary: `% of first submissions approved without a second round`

### Product spine (canonical)

```text
Brand enough → Candidate (Generate | Upload) → Send → Decide → Rework / Approved
```

Status machine in `src/lib/status.ts` stays authoritative. **UI language** maps for humans:

| Status | Creator label | Client label |
|--------|---------------|--------------|
| `draft` | Working | — |
| `agency_review` | Internal check | — |
| `submitted` / `brand_review` | Waiting on client | Needs your decision |
| `changes_requested` | Fix & resend | You asked for changes |
| `approved` | Approved | Approved |
| `rejected` | Not moving forward | Declined |

---

## Peer bar (do not regress)

| Peer | Steal | Refuse |
|------|-------|--------|
| **Filestage** | Asset hero, email → decide &lt;3 clicks, rounds | Generation-blind product |
| **Typeface** | Brand context while creating | Enterprise agent sprawl |
| **GenStudio** | Compliance beside creative at decide time | Adobe/Workfront depth theater |

---

## Phases

| Phase | Doc | Focus | Outcome |
|-------|-----|--------|---------|
| **P1** | [PHASE-01-IA-WORK-STAGES.md](./PHASE-01-IA-WORK-STAGES.md) | IA + Work home + Job stage rail | Creators have one home and one stage path |
| **P2** | [PHASE-02-CREATIVE-EQUAL-ENTRY.md](./PHASE-02-CREATIVE-EQUAL-ENTRY.md) | Generate \| Upload parity in Creative stage | External work enters the same loop |
| **P3** | [PHASE-03-GUEST-DECIDE-INBOX.md](./PHASE-03-GUEST-DECIDE-INBOX.md) | Guest Decide link + Inbox | Clients decide without full SaaS onboarding |
| **P4** | [PHASE-04-ROUNDS-COMPLIANCE-POLISH.md](./PHASE-04-ROUNDS-COMPLIANCE-POLISH.md) | Round diff + compliance-on-Decide | Distinctive trust at decision time |

**Suggested order:** P1 → P2 → P3 → P4 (strict). P2 can start UI stubs in parallel with P1 Sprint 3 once stage shell exists.

---

## Archetypes served

| Archetype | Primary win from this suite |
|-----------|----------------------------|
| **Individual creative → client** | Upload + shareable Decide link |
| **Agency CD → brand** | Stage path + optional internal gate + compliance on Decide |

---

## Non-goals (entire initiative)

- Full DAM / Frontify replacement  
- Ad platform publishing / activation  
- Slack/Composio/Notion as review source of truth  
- Competing with Typeface/GenStudio on agent sprawl or Adobe ecosystem depth  
- New image model marketing as the product story  

---

## Design constraints

- Follow **DESIGN.md**: Fraunces for campaign/job titles only; Source Sans 3 for UI; warm cream canvas; teal = primary decide; amber = pending / idea-first / incomplete kit.  
- **Asset-first Decide:** creative ≥60% viewport.  
- **One primary next action** per screen.  
- Prefer motion sparingly (asset entrance, action bar, post-decide confirmation).  
- Submit/review remain **`POST /api/assets/submit`** and **`POST /api/assets/review`** only.

---

## Related docs

| Doc | Role |
|-----|------|
| [01-unified-creative-pipeline](../01-unified-creative-pipeline/) | Existing upload + gen pipeline (reuse, don’t rebuild) |
| [06-persona-flows](../../06-persona-flows/) | Update after P1–P3 ship (persona contracts) |
| [03-human-review-in-app.md](../../02-creativegen-mvp/03-human-review-in-app.md) | Review API contracts |
| [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md) | Legacy screen inventory (superseded for creator/approver IA by this suite) |

---

## Delivery log

| Sprint | PR |
|--------|----|
| P1 · 1.1–1.3 | IA, Work home, job stages, human status language (#34–#36) |
| P2 · 2.1–2.2 | Generate \| Upload parity, brand-check honesty (#37, #38) |
| P3 · 3.1–3.3 | Guest review links API, `/r/:token` Decide, Inbox + link UX (#39–#41) |
| P4 · 4.1 | On-brand check on Decide (#42) |
| P4 · 4.2 | Rounds & compare to previous (#43) |
| P4 · 4.3 | Fix & resend, stale nudge, north-star metrics, QA, docs |

**Migrations to apply (root `supabase/migrations/`):** `032_review_links.sql`, `033_review_round_snapshots.sql`, `034_handoff_metrics_view.sql`.

**North-star query:** `handoff_decision_metrics` view (034) — e.g. `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY hours_to_decision) FROM handoff_decision_metrics WHERE round = 1;` and `SELECT avg(approved_first_round::int) FROM handoff_decision_metrics WHERE round = 1;`. Client events: `decide_completed { decide_via, round, hours_to_decision, approved_first_round, candidate_source }`, `assets_sent { candidate_source }`, `asset_resent { round, revised }`.

**Follow-ups (filed, not in scope):** image pin comments (#44), guest comments (#45), multi-asset guest packs (#46), billing & seats (#47), review endpoint org check (#48), shared rate limiting for guest links (#49).

---

## Execution notes

- Prefer **stacked PRs per sprint**; merge to `main` before starting the next sprint when possible.  
- Update `docs/06-persona-flows/` in the same PR that changes routes, anchors, or status UX labels.  
- Human review stays **in-app** (+ Resend email); no Composio/Slack for MVP of this suite.
