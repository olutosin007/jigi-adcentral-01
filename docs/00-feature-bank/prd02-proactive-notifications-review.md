# PRD 02 — Proactive Notifications & Review Module

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

A self-contained, project-based module for **proactive notifications, messaging, review, and approval**. Designed to be modular (e.g. for Base44 integration) so it can be seamlessly added to Jigi. The module centralises in-app and optional email notifications around asset lifecycle events and review actions.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Reduce review latency | Reviewers are notified promptly when assets need attention |
| Context-aware messaging | Notifications are scoped to the project/campaign and include actionable links |
| Modular design | Module can be enabled/disabled and integrated without core app changes |
| Optional email | Users can opt in/out of email notifications per notification type |

---

## User Stories

### As a brand reviewer
- I want to receive a notification when an agency submits an asset for my review
- I want to click the notification and land directly on the asset review page
- I want to control whether I receive email in addition to in-app notifications

### As an agency creative
- I want to be notified when my submitted asset is approved, rejected, or has changes requested
- I want to receive a notification when a brand adds a comment or feedback

### As a project owner
- I want to see all notifications for a project in one place
- I want to mark notifications as read and dismiss them

---

## Functional Requirements

### 1. Notification types

| Type | Trigger | Recipients (default) |
|------|---------|----------------------|
| `submission` | Asset submitted for brand review | Brand org admins/approvers |
| `approval` | Asset approved | Asset creator |
| `rejection` | Asset rejected | Asset creator |
| `changes_requested` | Brand requests changes | Asset creator |
| `comment_added` | Comment on asset | Asset creator, other reviewers |
| `nudge_reminder` | Stale asset (e.g. 48h untouched) | Campaign owner |

### 2. Data model

- Extend existing `notifications` table (or create if not present):
  - `user_id`, `type`, `title`, `body`, `related_asset_id`, `related_campaign_id`
  - `read`, `read_at`, `email_sent`, `email_sent_at`
  - `generation_mode` (optional, for context)
- Project-scoped: notifications are filterable by `related_campaign_id`

### 3. Module API

- **Create notification:** `POST /api/notifications/send` (or equivalent)
- **List notifications:** `GET /api/notifications?campaign_id=...&user_id=...`
- **Mark read:** `PATCH /api/notifications/:id` with `read: true`
- **Preferences:** `GET/PUT /api/notifications/preferences` for email opt-in per type

### 4. UI components

- **Notification bell:** Header icon with unread count; dropdown list of recent notifications
- **Notification item:** Title, body snippet, link to asset/campaign, timestamp
- **Notification preferences:** Settings page section for email toggles per type

### 5. Modularity

- **Config:** Feature flag or env var to enable/disable module
- **Hooks:** Core app emits events (e.g. `asset.submitted`, `asset.approved`); module subscribes and creates notifications
- **Storage:** Notifications table and RLS policies isolated; no schema changes to core assets/campaigns

---

## Technical Considerations

- **Real-time:** Optional Supabase Realtime subscription for live notification updates
- **Email:** Integrate with Resend (or existing provider); respect user preferences
- **Rate limiting:** Avoid notification spam; batch or debounce where appropriate

---

## Acceptance Criteria

- [ ] User receives in-app notification when asset is submitted for their review
- [ ] User can click notification to navigate to asset review page
- [ ] User can mark notifications as read
- [ ] User can configure email preferences per notification type
- [ ] Notifications are scoped to the user and project; RLS enforced
- [ ] Module can be toggled via config without breaking core app

---

## Out of Scope (v1)

- Push notifications (mobile)
- Rich messaging (threads, replies)
- Custom notification rules per user

---

## Dependencies

- Existing `notifications` table and Supabase
- Asset status flow (submit, approve, reject, changes_requested)
- Email provider (Resend or equivalent)
