# 02 — Handoff OS

**Status:** Ready for sprint execution  
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

## Execution notes

- Prefer **stacked PRs per sprint**; merge to `main` before starting the next sprint when possible.  
- Update `docs/06-persona-flows/` in the same PR that changes routes, anchors, or status UX labels.  
- Human review stays **in-app** (+ Resend email); no Composio/Slack for MVP of this suite.
