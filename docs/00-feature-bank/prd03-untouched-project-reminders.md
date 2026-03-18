# PRD 03 — Untouched Project Reminders

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

After **48 hours** of no activity on a campaign, the system sends a reminder to the campaign owner or creator to either **progress** the campaign or **archive** it. Archived campaigns can be easily **unarchived** when work resumes. This reduces clutter and keeps the dashboard focused on active work.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Reduce stale campaigns | Users are prompted to act on campaigns with no activity for 48h |
| Easy archive/unarchive | One-click archive; one-click unarchive when work resumes |
| Clean dashboard | Archived campaigns are hidden by default but accessible when needed |

---

## User Stories

### As a campaign owner
- I want to receive a reminder after 48 hours if my campaign has had no activity
- I want to archive a campaign I'm not actively working on so it doesn't clutter my view
- I want to unarchive a campaign when I'm ready to pick it up again

### As an agency creative
- I want to see only active campaigns by default
- I want to filter or search for archived campaigns when I need to resume

---

## Functional Requirements

### 1. Activity detection

- **Activity:** Any of: asset created, asset status changed, brief updated, comment added
- **Last activity timestamp:** Store `last_activity_at` on `campaigns` (or derive from `campaigns.updated_at` or related tables)
- **48h threshold:** Configurable (e.g. env var `NUDGE_INACTIVE_HOURS=48`)

### 2. Campaign archive

- Add `archived` boolean (or `status` enum including `archived`) to `campaigns`
- Add `archived_at` timestamp (optional)
- RLS: archive/unarchive allowed for users with campaign access

### 3. Reminder flow

- **Cron/scheduled job:** `GET /api/cron/nudge` (or similar) runs periodically (e.g. daily)
- **Logic:** Find campaigns where `last_activity_at` < now - 48h and `archived = false`
- **Action:** Create notification for campaign owner: "Campaign X hasn't had activity in 48 hours. Progress or archive?"
- **Link:** Include CTA to campaign detail or a quick-action modal (Progress / Archive)

### 4. UI

- **Archive button:** On campaign detail or campaign card; "Archive" with confirmation
- **Unarchive:** In archived campaigns list or campaign detail; "Unarchive" or "Restore"
- **Filter:** Dashboard/campaign list: "Active" (default) vs "Archived" toggle or tab
- **Reminder notification:** In-app notification with "Progress" and "Archive" actions

### 5. Nudge log (optional)

- Table `nudge_log` (or similar): `campaign_id`, `user_id`, `nudge_type`, `sent_at`
- Prevents duplicate nudges within a window (e.g. don't nudge again for 7 days after first nudge)

---

## Technical Considerations

- **Cron:** Vercel Cron or external scheduler; ensure idempotency
- **last_activity_at:** Update via trigger on `creative_assets`, `asset_status_history`, or brief updates

---

## Acceptance Criteria

- [ ] Campaign with no activity for 48h triggers a reminder notification
- [ ] User can archive a campaign from campaign detail or list
- [ ] User can unarchive an archived campaign
- [ ] Archived campaigns are hidden from default view but accessible via filter
- [ ] Reminder includes actionable links (Progress / Archive)
- [ ] Nudge does not repeat within 7 days for the same campaign (or configurable)

---

## Out of Scope (v1)

- Auto-archive after X days
- Bulk archive
- Archive reasons or notes

---

## Dependencies

- `campaigns` table
- Notifications module (PRD 02)
- Cron/scheduler infrastructure
