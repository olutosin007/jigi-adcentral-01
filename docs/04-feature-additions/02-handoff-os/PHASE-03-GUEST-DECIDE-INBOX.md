# Phase 3 — Guest Decide & Inbox

**Initiative:** [Handoff OS](./README.md)  
**Status:** Ready  
**Duration:** 3 sprints (~3 weeks)  
**Depends on:** P1 (Send stage + human labels); P2 recommended so upload demos work for freelancers  
**Unlocks:** Archetype 1 sellability; P4 polish on Decide chrome

---

## Goal

Deliver the distinctive handoff surface: clients/brand approvers open a **Decide** experience from email or a share link, act in few clicks, **without** learning the creator shell. Authenticated reviewers get a calmer **Inbox**. Creators get **Copy link / Email** on Send.

This is the Filestage bar for entry; Jigi keeps brand context hooks for P4.

---

## User-facing outcomes

| Who | After P3 |
|-----|----------|
| Client / brand approver | Magic link or invite → asset hero → Approve / Request changes / Decline |
| Individual creative | Shares a link; client need not create a full org on first decision |
| Agency | Brand users still use Inbox; guest links optional per send |
| Creator | Sees Waiting / decisions update when guest acts |

---

## Sprint summary

| Sprint | Focus | Key deliverables |
|--------|--------|------------------|
| **3.1** | Review tokens + API | Secure tokens, expire, bind to asset/campaign; guest review actions via API |
| **3.2** | Decide surface (`/r/:token`) | Asset-first layout; auth-light identity; mobile sticky actions |
| **3.3** | Inbox + Send link UX | Inbox rename/polish; Copy link / Email from Send; notifications deep-link to Decide |

---

## Sprint 3.1 — Tokens & guest review API

**Duration:** ~1 week  
**Goal:** Safe server path for guest decisions.

### Scope

1. **Schema**
   - `review_links` (or equivalent): `id`, `token_hash`, `asset_id`, `campaign_id`, `brand_id`, `created_by`, `expires_at`, `revoked_at`, `max_uses` (optional), `last_used_at`.
2. **APIs**
   - `POST /api/review-links` — creator with access; returns raw token once + URL.
   - `GET /api/review-links/:token` — public metadata + asset preview payload (no privileged org dump).
   - `POST /api/review-links/:token/review` — body mirrors review actions (`approve` \| `reject` \| `request_changes`, `notes?`); writes same status history / approval_actions as authenticated `POST /api/assets/review`.
3. **Security**
   - Hash tokens at rest; short TTL default (e.g. 14 days) configurable; revoke on demand; rate limit; audit `reviewed_via: 'guest_link'` + optional guest name/email.
4. **Permissions**
   - Link creation requires same access as submit; action only valid while asset in `submitted` \| `brand_review`.

### Acceptance

- [ ] Guest can approve/request changes/reject through token API; asset status + history match authenticated path.
- [ ] Expired/revoked tokens fail closed.
- [ ] No service-role leakage to client; RLS or server-only service role as elsewhere.
- [ ] Tests: token lifecycle + action matrix + expire/revoke.

### Out of scope

- Full pin-annotation system (basic comments OK if cheap; pins → P4 if needed).
- Multi-asset “batch guest session” (v1 = one asset per link; batch = list of links or campaign pack later).

---

## Sprint 3.2 — Decide UI (`/r/:token`)

**Duration:** ~1 week  
**Goal:** Filestage-like decide composition (DESIGN.md asset-first).

### Scope

1. **Route** `/r/:token` outside creator `AppLayout` sidebar.
2. **Layout**
   - Quiet Jigi mark; **brand name** loud; campaign + round label.
   - Center: asset preview ≥60–70% width; zoom.
   - Right (or bottom on mobile): brief collapsed; comments/notes; placeholder slot for **On-brand check** (wire real data in P4; show skeleton or “Brand check in next update” only if needed — prefer hide until P4).
   - Sticky actions: **Approve** (teal) · **Request changes** · **Decline**.
3. **Auth-light gate**
   - First action or entry: name + optional email (for audit), not full signup.
   - Optional: “Create account to track approvals” post-decide (soft).
4. **Motion** (2–3 intentional)
   - Asset entrance; action bar settle; brief success → optional next-link if provided later.
5. **Errors**
   - Expired / already decided / revoked empty states with human copy.

### Acceptance

- [ ] Client completes decide on mobile and desktop without sidebar.
- [ ] Keyboard shortcuts for authenticated Decide can be ported lightly; guest: large tap targets.
- [ ] Creator notified via existing notification/email paths after guest action.
- [ ] Visual QA against DESIGN.md (cream, teal approve, amber waiting).

### Out of scope

- Round compare (P4); compliance scoring UI (P4).

---

## Sprint 3.3 — Inbox + Send link UX

**Duration:** ~1 week  
**Goal:** Close the creator ↔ client loop in-product.

### Scope

1. **Inbox** (`/app/inbox` or rename `/app/review`)
   - Group by campaign; amber Needs decision; thumbnail; age; round; CTA **Review**.
   - Authenticated path opens full Decide chrome (can reuse AssetReview layout aligned with `/r/:token` components).
2. **Send stage**
   - After submit (or as part of submit): **Copy link** + **Email invite** (Resend) with Decide URL.
   - Per-asset or per-send-batch links (document choice: **per asset** for v1 clarity).
3. **Notifications**
   - Email CTA → `/r/:token` for external; in-app → Inbox/Decide for members.
4. **Creator Decisions stage**
   - Show link status: Active · Opened · Decided · Expired; Revoke control.
5. **Docs**
   - Persona flows: Brand Approver entry via link; new Guest Approver path; anchors for Decide.

### Acceptance

- [ ] Freelancer demo: upload/generate → Send → Copy link → guest Approve → creator sees Approved.
- [ ] Agency demo: Send to brand → email → Inbox/Decide → changes → Fix & resend.
- [ ] Revoke prevents further guest actions.
- [ ] Persona-flow + anchor inventory updated.

### Out of scope

- Billing for guest seats; SSO for enterprise guests.

---

## Technical notes

| Area | Guidance |
|------|----------|
| Shared UI | Extract `DecideLayout`, `DecideActions`, `AssetHeroPreview` used by `/r/:token` and `/app/review/:id` |
| Email | Resend templates: `review_request_guest`, reuse nudge patterns |
| Status | Guest actions must call same domain logic as `server/api/assets/review.ts` (extract shared function) |
| Analytics | `decide_opened`, `decide_completed` with `via: guest|authenticated` |

---

## Design notes

- Guest Decide is a **composition**, not a dashboard — brand name > Jigi chrome.
- No generation controls on Decide.
- Decline is available but visually quieter than Approve / Request changes (avoid accidental destructive weight unless product prefers symmetry — match existing ReviewActions).

---

## Exit criteria (phase)

- [ ] Guest can complete the decision loop from a link.
- [ ] Send stage issues copyable links + email.
- [ ] Inbox is the authenticated approver home.
- [ ] Security review of token design signed off in PR description.
