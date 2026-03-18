## Flow 3 – Human-in-the-Loop Creative Review (In-App)

### 1. Overview

This flow describes human QA, review, and approval of generated creatives **inside the Jigi app**. Reviewers use the Review Queue and Asset Review pages to approve, reject, or request changes. Submitters and reviewers are notified by in-app notifications and email (Resend). No Slack, Notion, or Composio are required for MVP.

*Optional later:* A future extension could mirror or trigger review from external tools (e.g. Slack/Notion via Composio); the app remains the source of truth.

### 2. Actors

- **Creator (Agency)**: Generates creatives, submits for review from the app.
- **Reviewer (Brand/Approver)**: Reviews in Jigi (Review Queue → Asset Review), approves/rejects/requests changes.
- **Jigi App**: Owns the full flow—submit, review, status, notifications, and email.
- **Resend**: Sends transactional emails (submission, approval, rejection, changes requested, nudge).

### 3. Preconditions

- Creatives exist in `creative_assets` (from Flows 1/2).
- User roles and org structure are set (reviewers have `admin` or `approver` role).
- Resend is configured for notification emails.
- DB has `asset_status_history`, `approval_actions`, `notifications` (and related RLS).

### 4. Happy Path – Step-by-Step

1. **Creator submits for review**
   - From campaign/asset view, creator selects asset(s) and uses "Submit for review" (or equivalent).
   - Target can be agency review or brand review (e.g. `agency_review` → `submitted` → `brand_review`).
   - Frontend calls `POST /api/assets/submit` with `asset_id` and `target` (`agency_review` | `brand_review`).

2. **Backend updates status and notifies**
   - `api/assets/submit.ts`:
     - Validates current status allows transition.
     - Writes new status to `creative_assets` and `asset_status_history`.
     - If target is brand review (`submitted`), looks up org reviewers (e.g. `admin`, `approver`), creates in-app notifications and sends submission email (Resend) with link to `/app/review/{asset_id}`.

3. **Reviewer opens Review Queue**
   - Reviewer goes to Review Queue (e.g. `/app/review`).
   - Queue lists campaigns/assets by status (e.g. submitted, brand_review).
   - Reviewer clicks into an asset to open Asset Review (`/app/review/{asset_id}`).

4. **Reviewer takes action in Asset Review**
   - Reviewer sees asset preview, metadata, and actions: Approve, Reject, Request changes.
   - Reviewer chooses one and optionally adds notes.
   - Frontend calls `POST /api/assets/review` with `asset_id`, `action` (`approve` | `reject` | `request_changes`), and optional `notes`.

5. **Backend applies review and notifies**
   - `api/assets/review.ts`:
     - Validates asset is in a reviewable status (`submitted`, `brand_review`).
     - Updates `creative_assets.status` to `approved` | `rejected` | `changes_requested`.
     - Records in `asset_status_history` and `approval_actions`.
     - Creates in-app notification for submitter and sends outcome email (approval / rejection / changes requested) with link back to the app.

6. **Creator sees outcome**
   - Creator sees status and notifications in-app; can open asset/campaign to see approval, rejection, or change request and notes.
   - For `changes_requested`, creator can iterate and resubmit (same submit flow).

7. **Nudge for stale reviews (optional cron)**
   - Cron (e.g. `api/cron/nudge`) finds assets in `submitted` or `brand_review` older than a threshold.
   - Sends reminder notification and email to reviewers with link to `/app/review/{asset_id}`.

### 5. Status Model (In-App)

- **draft** → agency_review | submitted
- **agency_review** → draft | submitted
- **submitted** → brand_review
- **brand_review** → approved | rejected | changes_requested
- **changes_requested** → draft | submitted
- **approved** / **rejected**: terminal.

Implemented in `src/lib/status.ts` and enforced in submit/review APIs.

### 6. Error / Edge Cases

- **Invalid transition**: API returns 400 with clear message; UI disables invalid actions.
- **Asset not found or not reviewable**: API returns 404/403; UI shows error.
- **Email failure**: Log and optionally retry; in-app notification still created so flow is not blocked.
- **No reviewers for org**: Submit still succeeds; only in-app notifications if any; document that Resend and reviewer list must be configured.

### 7. Out of Scope for MVP (Optional Later)

- **Composio / Slack / Notion**: Pushing review to Slack (e.g. post + collect emoji/comments) or logging to Notion. Can be added later as an extension that calls the same in-app APIs or mirrors status.
- **Multi-step or custom workflows**: More than agency → brand review; can be added when needed.
- **SLA / due dates**: "Stalled" auto-escalation beyond simple nudge; can be added later.

### 8. Implementation Checklist (MVP)

- [x] Ensure `api/assets/submit.ts` and `api/assets/review.ts` are live and wired to frontend.
- [x] Review Queue and Asset Review pages load correct data and respect status/roles.
- [x] Submit modal/actions call submit API; review actions (Approve/Reject/Request changes) call review API.
- [x] Resend templates and env for submission, approval, rejection, changes-requested, and nudge.
- [ ] Nudge cron (if used) runs on schedule and only notifies for configured roles.
- [ ] RLS and API auth restrict submit/review to intended users/orgs.
- [x] Document for deploy: Resend API key, reviewer roles, and (if used) nudge schedule.

### 9. Deploy / environment checklist

Set these in the environment where the Jigi API runs (e.g. Vercel project env):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Required. Resend API key for sending submission, approval, rejection, changes-requested, and nudge emails. |
| `EMAIL_FROM` | Optional. From address for transactional emails (e.g. `Jigi <notifications@yourdomain.com>`). Defaults to Resend onboarding address if unset. |
| `VITE_APP_URL` | Required for correct links in emails. Base URL of the app (e.g. `https://app.jigi.com`). Used in submission, review outcome, and nudge emails for "Review Now" / "View Asset" links. |

**Reviewer roles:** Users who receive submission and nudge notifications are those in the same organisation as the campaign’s brand, with `role` in `admin` or `approver`. Ensure `users.organisation_id` and `users.role` are set correctly.

**Nudge cron (optional):**

- Endpoint: `GET` or `POST` to `/api/cron/nudge`.
- Auth: `Authorization: Bearer <CRON_SECRET>`.
- Env: set `CRON_SECRET` and configure your scheduler (e.g. Vercel Cron) to call the route with that header.
- Schedule: e.g. daily; the handler finds assets in `submitted` or `brand_review` older than 24 hours and sends at most one nudge per asset per day per reviewer (via `nudge_log`).
