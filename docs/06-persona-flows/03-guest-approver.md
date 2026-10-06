# Persona flow — Guest Approver (review link)

## 1. Snapshot

| | |
|---|---|
| **Who** | Client of an individual creative, or a brand stakeholder who is not a Jigi user |
| **Role** | None — no account. Identified by name (required) + email (optional) at decision time |
| **Primary goal** | Open a link, see the creative, decide — in under a minute |
| **Success metric** | Link opened → decision recorded without signup |
| **Owns statuses** | `submitted` / `brand_review` → `approved` / `rejected` / `changes_requested` |

## 2. Entry point & preconditions

- The creator has sent the asset to the client (`submitted`) and either:
  - typed a client email in the **Send** stage (*Email a review link*), which emails a link per asset, or
  - clicked **Share link** on the asset under **Decisions → Waiting on client** and copied/emailed it.
- Link is active: not revoked, not expired (default 14 days), not already decided.
- Server: `POST /api/review-links` (create), `GET /api/review-links?token=…` (view), `POST /api/review-links?action=review&token=…` (decide). DB: `review_links` (migration `032`).

## 3. Ideal (happy) path

| # | User action | Route | Component | System response | Status after | Anchor |
|---|-------------|-------|-----------|-----------------|--------------|--------|
| 1 | Open email / link | `/r/:token` | `GuestDecide` | Brand-first header, asset hero, *Needs your decision* | `submitted` | `guest-decide` |
| 2 | Look at the work | `/r/:token` | `AssetHeroPreview` | Zoomable image / copy card / concept; team note + collapsed brief | — | `decide-asset` |
| 3 | Decide | `/r/:token` | `DecideActions` → `GuestDecisionDialog` | Name (+ optional email); notes required for *Request changes* | — | `decide-actions` |
| 4 | Confirm | `/r/:token` | `GuestDecide` (done state) | `applyReviewDecision` — same status/history/notifications as in-app; link marked decided | `approved` \| `changes_requested` \| `rejected` | — |

## 4. Branches

- **Expired / revoked / used** → human empty state ("Ask the person who sent it for a fresh link").
- **Already decided** (by this link, or in-app by a member) → shows the recorded decision; no second decision.
- **Creator revokes** from Decisions → further opens fail closed.

## 5. What the creator sees

- **Decisions → Waiting on client** shows link status: *Link sent → Link opened → {Name} approved / asked for changes / declined*, or *Link expired / revoked*. **Revoke** and **New link** controls live on the row.
- Creator gets the usual in-app notification + email; reviewer name reads "{Name} (via review link)".

## 6. Audit

`approval_actions.reviewed_via = 'guest_link'` with `guest_name`, `guest_email`, `review_link_id`; `asset_status_history.reviewed_via = 'guest_link'`, `user_id = null`.
