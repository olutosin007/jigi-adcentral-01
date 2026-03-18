# PRD 04 — Review Bottleneck Triage

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

An **agentic** module that monitors review queues (brand_review, agency_review), identifies assets stuck for X days, and proactively surfaces them with prioritisation. Sends targeted nudges to reviewers to unblock stalled reviews.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Reduce review latency | Reviewers are notified of assets waiting >3 days |
| Prioritisation | Oldest or highest-priority assets surface first |
| Measurable impact | Average time-in-review decreases |

---

## User Stories

### As a brand reviewer
- I want to see which assets have been waiting longest for my review
- I want to receive a nudge when assets are stuck for more than 3 days

### As a review queue manager
- I want a dashboard view of "5 assets waiting >3 days" with one-click navigation
- I want to know which reviewer should act (e.g. by workload)

---

## Functional Requirements

### 1. Stale asset detection

- **Statuses:** `brand_review`, `agency_review`, `submitted` (depending on flow)
- **Threshold:** Configurable (e.g. 3 days); store `submitted_at` or derive from `asset_status_history`
- **Query:** Assets where `status` in review queue and `updated_at` or `submitted_at` < now - threshold

### 2. Prioritisation

- **Primary:** Oldest first (by `submitted_at` or `updated_at`)
- **Optional:** By campaign due date, campaign priority, or asset type
- **Output:** Ordered list of asset IDs with days in queue

### 3. Targeted nudges

- **Recipients:** Brand org admins/approvers for `brand_review`; agency members for `agency_review`
- **Notification:** "5 assets waiting >3 days for review" with link to review queue or asset
- **Frequency:** Daily or configurable; avoid spam

### 4. Dashboard widget (optional)

- **Widget:** "Review queue: 5 assets waiting >3 days" with expandable list
- **Link:** Click asset → navigate to AssetReview page

### 5. Agentic behaviour

- **Cron/scheduled:** Runs periodically (e.g. daily)
- **Logic:** Query stale assets → prioritise → create notifications for relevant reviewers
- **Modular:** Can be a standalone service or Base44 agent that calls Jigi APIs

---

## Technical Considerations

- **asset_status_history:** Use to compute `submitted_at` or `updated_at` per status
- **RLS:** Ensure agent/service can query assets for notification creation; use service role or dedicated RPC

---

## Acceptance Criteria

- [ ] System identifies assets in review queue for >3 days (configurable)
- [ ] Notifications are sent to appropriate reviewers with asset links
- [ ] Prioritisation is by oldest first (or configurable)
- [ ] Optional dashboard widget shows stale assets count and list
- [ ] Nudge frequency is configurable

---

## Out of Scope (v1)

- Workload-based reviewer assignment
- SLA tracking per campaign
- Escalation paths

---

## Dependencies

- `creative_assets`, `asset_status_history`
- Notifications module (PRD 02)
- Cron/scheduler
