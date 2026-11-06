# Phase 4 — Rounds, Compliance-on-Decide & Polish

**Initiative:** [Handoff OS](./README.md)  
**Status:** Implemented  
**Duration:** 3 sprints (~3 weeks)  
**Depends on:** P3 Decide surface (guest + authenticated sharing components)  
**Unlocks:** Distinctive “brand-aware proofing” vs Filestage; trust vs GenStudio-lite

---

## Goal

Make Decide **uniquely Jigi**: on-brand confidence beside the asset, round-aware resubmits with **what changed**, and polish that hits the north-star metric (faster first decision, fewer pointless second rounds).

---

## User-facing outcomes

| Who | After P4 |
|-----|----------|
| Approver | Sees On-brand check + brief + history while deciding |
| Creator | Resend creates Round N; client sees diff vs prior |
| Both | Changes-requested returns as a clear to-do, not a scavenger hunt |
| Product | Demo script: “Filestage decide + brand memory” |

---

## Sprint summary

| Sprint | Focus | Key deliverables |
|--------|--------|------------------|
| **4.1** | Compliance on Decide | On-brand check panel on Decide (guest + auth); honesty rules |
| **4.2** | Rounds & what-changed | Round numbering, compare prior, resend UX |
| **4.3** | Journey polish & metric | Fix&resend creator UX, pins/comments upgrade, north-star instrumentation, DESIGN QA |

---

## Sprint 4.1 — On-brand check on Decide

**Duration:** ~1 week  
**Goal:** GenStudio lesson — confidence at decision time.

### Scope

1. **Decide right rail: On-brand check**
   - Reuse `ComplianceDisplay` / drift / validation summaries already computed for assets.
   - Checklist form: tone / language / visual (as available); overall cue: Pass · Review · Incomplete kit.
2. **Honesty**
   - Incomplete brand kit → amber *Guidance only* (never greenwashed).
   - Uploaded without check → CTA *Run check* or *Not checked yet*.
3. **Send stage preview**
   - Compact compliance strip before confirm send (creator sees what client will see).
4. **Guest payload**
   - Include sanitized compliance summary in `GET /api/review-links/:token` (no internal prompt dumps).

### Acceptance

- [ ] Decide always shows brand check slot with truthful state.
- [ ] Guest and authenticated Decide share the same panel component.
- [ ] Incomplete kit cannot show as full pass.

### Out of scope

- Training custom brand models; ADA/legal disclosure libraries.

---

## Sprint 4.2 — Rounds & what changed

**Duration:** ~1 week  
**Goal:** Filestage habit — rounds with evidence.

### Scope

1. **Round model**
   - Derive round from submit count / status history (prefer computed from `asset_status_history` before new columns; add `review_round` if required).
2. **Decide header**
   - *Round 2 · Waiting on you* (amber).
3. **Compare**
   - For Round ≥ 2: toggle **Compare to previous** (side-by-side or slider for images; text diff for copy).
4. **Resend**
   - Creator Fix & resend explicitly increments round; notifications say *Revised — Round N*.
5. **Decisions stage**
   - Group by round; show waiting age.

### Acceptance

- [ ] Second submit surfaces as Round 2 for creator and approver.
- [ ] Compare works for image assets; copy shows prior vs current fields.
- [ ] Email/in-app copy mentions round.

### Out of scope

- Multi-file layered comps; video scrubbers.

---

## Sprint 4.3 — Journey polish & instrumentation

**Duration:** ~1 week  
**Goal:** Close archetype loops; measure north star.

### Scope

1. **Creator Fix & resend**
   - From notification / Decisions: open asset with review notes pinned/prominent; primary CTA *Resend*.
2. **Comments**
   - Ensure threaded notes work on Decide; image pin comments if partially present — ship MVP pins or explicitly defer with issue (prefer ship basic pin if &lt;2 days).
3. **Work next-action**
   - Tune helper using rounds + waiting age (nudge stale Waiting).
4. **Analytics**
   - `hours_to_first_decision`, `approved_first_round_rate`, `decide_via`, `candidate_source`.
5. **DESIGN.md QA pass**
   - Typography roles, status colors, Decide ≥60% asset, no dashboard clutter regression on Work.
6. **Docs**
   - Final persona-flow sync; README status → Implemented; short demo script in this folder (`DEMO.md`).

### Acceptance

- [ ] End-to-end Archetype 1 & 2 demos scripted and pass on staging.
- [ ] North-star events queryable (even if dashboard UI is minimal).
- [ ] No submit/review bypasses introduced.
- [ ] `DEMO.md` committed.

### Out of scope

- Public marketing site rewrite (optional follow-up).
- Billing / seat plans.

---

## Technical notes

| Area | Guidance |
|------|----------|
| Compliance | Read from existing asset content / compliance fields; avoid live LLM on every guest open unless cached |
| Rounds | Prefer history-derived rounds for audit consistency |
| Compare | Store prior content snapshot on submit if needed for stable diffs |
| Shared Decide | All P4 UI goes through shared Decide components from P3 |

---

## Design notes

- On-brand check is a **calm checklist**, not a gamified score burst.
- Compare mode: secondary control; default remains current creative as hero.
- Success after approve: quiet, human — not confetti.

---

## Exit criteria (phase + initiative)

- [ ] Decide is brand-aware and round-aware.
- [ ] Both archetypes have a crisp demo path.
- [ ] Handoff OS README marked complete; follow-ups filed (pins, billing, multi-asset guest packs) as separate issues — not silent scope creep.
