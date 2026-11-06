# Handoff OS — Demo script

**Pitch:** *Filestage-grade decide, with brand memory.* On-brand drafts, client yes, same place.

**Prereqs (staging):** migrations `032`–`034` applied; Resend configured; one brand with a **complete** kit and one with a **partial** kit; an agency user (creator) and a brand org approver. Run locally with `pnpm dev:full` from `uiux/jigi-app`.

Each demo is ~5 minutes. Say the italic lines out loud.

---

## Archetype 1 — Individual creative → client (upload + guest link)

*"I made this in Figma. I just need my client's yes — without making them sign up."*

1. **Work home** (`/app/work`) — one row per job, one next action each. Open a job.
2. **Creative → Upload** (`?stage=concepts&mode=upload`) — drop 2 PNGs and paste a line of copy. Types are inferred; fix one with the per-file select. **Add 3 to job.**
   *"Uploaded work enters the same loop as AI work."*
3. **Check against brand** on the uploaded list — chips read *Looks on-brand* (complete kit) or *No issues found · Guidance only* (partial kit).
   *"We never green-tick a brand we don't fully know."*
4. **Send** — select all, *Client / brand*, add a message, enter the client's email under **Email a review link**. Note the strip: *Client will see: 2 look on-brand · 1 not checked*. **Send 3 to client.**
5. Open the email (or **Decisions → Share link → Copy**) in a private window → **`/r/:token`**.
   - Brand-first header, creative ≥60% of the screen, *Needs your decision* chip, team note, **On-brand check**, collapsible brief.
   - **Request changes** → notes + name → *Changes requested* confirmation. No account.
6. Back as the creator: **Decisions → Fix & resend** shows the client's notes inline. Click **Resend as Round 2**.
   - Notes pinned at the top; upload a revised PNG (or edit the headline); *Tell the client what changed*. **Resend as Round 2.**
   - Toast: *Sent as Round 2 — new link emailed to …*
7. Client opens the new email (*Revised — Round 2*) → chip reads **Round 2 · Needs your decision** → **Compare to previous** (side-by-side / field diff) → **Approve**.
8. Creator: **Approved** stage → download.
   *"Two rounds, zero logins for the client, every decision audited."*

**Pass criteria:** guest never sees a login; Round 2 is labelled in email, Decide and Decisions; compare shows the actual change; `asset_status_history` has `reviewed_via = 'guest_link'` rows.

---

## Archetype 2 — Agency CD → brand approver (generate + internal gate + in-app review)

*"We generate on-brand, QA internally, then the brand signs off with the evidence beside the work."*

1. **New job** → brief (3-step) → **Creative → Generate** a concept, copy and image (production path).
2. **Send → Internal check first** for the image; a reviewer passes it on (*Internal check* bucket in Decisions).
3. **Send to client** for the copy + image (no email — the approver is an in-app user).
4. As the **brand approver**: **Inbox** (`/app/review`) groups waiting work by job, oldest first. Open an asset.
   - Header: amber *Waiting on you*; sidebar leads with **On-brand check** (verdict + checklist, *Run check* if unchecked).
   - **Request changes** with a note.
5. As the creator: the email link (`?stage=decisions&fix=…`) opens **Fix & resend** directly. Edit the headline → **Resend as Round 2**.
6. Approver: Inbox → asset → **Round 2 · Waiting on you** → **Compare to previous** shows the headline diff → **Approve**.
7. Work home: the job's next action moves on; anything left waiting 3+ days shows **Nudge client**.

**Pass criteria:** internal gate never notifies the brand; approver sees human status labels only; round + compare work in-app; approve lands in Approved for the creator.

---

## North-star check (after either demo)

```sql
SELECT decide_via, round, hours_to_decision, approved_first_round
FROM handoff_decision_metrics
ORDER BY decided_at DESC
LIMIT 10;
```

Expect one row per decision, `decide_via` = `guest_link` (Archetype 1) or `app` (Archetype 2), and `round` = 1 then 2.

---

## Known limits (say if asked)

- One asset per guest link (packs: #46). No pin comments yet (#44, #45).
- Guest link rate limiting is per-instance (#49).
