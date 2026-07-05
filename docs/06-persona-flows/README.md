# Persona flows

Single source of truth for the two key user journeys through Jigi:

1. **[Agency Creative](./01-agency-creative.md)** — turns an idea/brief into on-brand creative and submits it for approval.
2. **[Brand Approver](./02-brand-approver.md)** — reviews submitted creative and approves, rejects, or requests changes.

Shared model (roles, the asset status machine, the single handoff between the two personas) lives in **[00-flow-model.md](./00-flow-model.md)**.

## Why these docs exist

These specs are the **shared contract** for three consumers, so they never drift:

| Consumer | Uses these docs for |
|----------|---------------------|
| **In-app guided tour** (onborda) | Step order, copy, and which element each step points at |
| **Automated E2E** (later, Playwright) | The golden path + the selectors to drive it |
| **QA / design review** | The definition of "correct" for each journey |

The bridge that keeps all three in sync is **[anchor-inventory.md](./anchor-inventory.md)** — a table pairing every flow step with the real component and a stable `data-tour` id.

## How to keep them accurate

These docs are **derived from code**, not written from memory. When the flows change, update the doc in the same PR:

- **Status machine** mirrors `uiux/jigi-app/src/lib/status.ts` (`STATUS_TRANSITIONS`).
- **Roles** mirror `uiux/jigi-app/src/lib/roles.ts` (`UserRole`, `isReviewerRole`).
- **Handoff** mirrors the server endpoints `server/api/assets/submit.ts` and `server/api/assets/review.ts`.
- **Routes** mirror `uiux/jigi-app/src/App.tsx`.

If a diagram and the code disagree, the code wins — fix the diagram.

## Conventions used in these docs

- **Route** = path under `/app` (see `App.tsx`).
- **Status after** = the `creative_assets.status` value once the step completes.
- **Anchor** = the `data-tour` id from the anchor inventory (proposed; added in step 2 of the build).
- Steps marked _(optional)_ are branches, not part of the shortest happy path.
