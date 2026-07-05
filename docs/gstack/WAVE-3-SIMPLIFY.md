# Wave 3 — UI Simplification & Beauty

**Created:** 2026-06-30  
**Status:** Approved — A+B direction; HTML + autoplan complete  
**Bar:** Simple, seamless, beautiful (DESIGN.md execution, not new tokens)

**Chosen direction:** Variant **A** (pipeline rail) + **B** brief snippet (always visible below header).

**HTML reference:** `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/campaign-workspace-a-plus-b-20260630/finalized.html`  
**Autoplan:** `docs/gstack/WAVE-3-AUTOPLAN.md`

---

## Context

- Wave 1 shipped loop fixes (submit, StatusBadge, dashboard reorder, queue sort).
- UX canvas mapped 8 flows; P0 correctness in progress (auth, roles, single generator).
- Design-shotgun produced 3 layout directions for Campaign Workspace — pick one before React rebuild.

---

## Waves

### Wave 2a — Correctness (P0, in flight)

| Item | Why |
|------|-----|
| `/app` auth via `ProtectedRoute` | Trust |
| Remove Beta generator UI | Clarity — one generate path |
| Role gating (review routes, sidebar) | Agency ↔ brand handoff |
| View vs review routing | Creators don't land in reviewer UI |
| Settings role read-only for non-admin | Data integrity |

### Wave 2b — Design system (deferred T4–T6)

| Task | Source |
|------|--------|
| T4 Typography — Source Sans 3 + Fraunces | UI-REBUILD-PLAN |
| T5 Empty/error states per screen | UI-REBUILD-PLAN Pass 2 |
| T6 Mobile review bottom bar | UI-REBUILD-PLAN |

### Wave 3 — Simplification (new)

| Item | Screen | Outcome |
|------|--------|---------|
| Implement chosen shotgun direction | Campaign Detail + Generation | One calm workspace |
| Single page chrome | App shell | Drop duplicate AppLayout title |
| Role-aware dashboard | Dashboard | Creator home vs reviewer home |
| Restore journey fork | Setup | Idea-first → QuickStart |
| Unified asset card | Generation + Assets | One card pattern |
| Hide/wire dead controls | Header, Settings | No lying UI |

---

## Success criteria

- Campaign Detail feels like **one workspace**, not three tabs + a beta button.
- Generation reads as **concept → copy → image** without hunting dependencies.
- Reviewer opens app → pending block → one click to review (unchanged, preserved).
- Visual match to DESIGN.md: Fraunces titles, teal actions, warm cream, no nested card stacks.

---

## gstack next steps

1. **Pick shotgun variant** (A/B/C) from comparison board.
2. **`/design-html`** — high-fidelity HTML for chosen direction.
3. **`/autoplan`** — CEO/design/eng review of Wave 3 implementation tasks.
4. **`/ship`** — implement shell + campaign workspace from HTML reference.
5. **`/design-review`** — screenshot QA against DESIGN.md.

---

## References

- `DESIGN.md` — design source of truth
- `docs/gstack/UI-REBUILD-PLAN.md` — Wave 1/2 tasks
- `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/campaign-workspace-shotgun-20260630/comparison.html`
