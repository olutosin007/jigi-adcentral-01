# PRD 11 — Campaign Archive & Delete

**Status:** Draft  
**Version:** 1.0  
**Phase:** 11 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Add Archive and Delete actions for campaigns. **Archive** is a soft, reversible status change that hides campaigns from the default view. **Delete** is a hard, irreversible removal. Archive is uncapped; users can archive as many campaigns as they need.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Clear distinction | Archive = reversible; Delete = irreversible |
| Archive uncapped | No limit on archived campaigns |
| Safe delete | Delete only available for drafts; confirmation required |
| Discoverable actions | Archive/Unarchive/Delete accessible from card menu and detail page |

---

## User Stories

### As a user managing campaigns
- I want to archive campaigns I'm not actively working on so they don't clutter my view
- I want to unarchive campaigns when I'm ready to resume
- I want to permanently delete draft campaigns I no longer need
- I want to filter the list to see archived campaigns

### As a user who made a mistake
- I want to restore an archived campaign without losing any data
- I want a clear warning before deleting, since it cannot be undone

---

## Feature Specifications

### 1. Archive

| Aspect | Specification |
|--------|---------------|
| **Behaviour** | Sets campaign `status` to `archived` |
| **Reversibility** | Reversible via Unarchive (sets status back to previous or `draft`) |
| **Limit** | None; archive is uncapped |
| **Eligibility** | Any status: draft, active, completed |
| **Data** | All campaign data and assets preserved |

### 2. Unarchive

| Aspect | Specification |
|--------|---------------|
| **Behaviour** | Sets campaign `status` from `archived` to `draft` (or previous status if stored) |
| **Eligibility** | Only archived campaigns |
| **Data** | No data loss |

### 3. Delete

| Aspect | Specification |
|--------|---------------|
| **Behaviour** | Hard delete from database; campaign and related data removed |
| **Reversibility** | Irreversible |
| **Eligibility** | **Draft only** — active, completed, and archived campaigns cannot be deleted |
| **Confirmation** | Required; modal or dialog with explicit "Delete" action |
| **Cascade** | Campaign assets and related records deleted per DB schema |

---

## Sprints

### Sprint 1: Archive & Unarchive UI
**Duration:** 2–3 days

- Add Archive action to campaign card menu (three-dot or kebab menu)
- Add Unarchive action for archived campaigns (in card menu and detail page)
- Wire Archive to `updateCampaign(id, { status: 'archived' })`
- Wire Unarchive to `updateCampaign(id, { status: 'draft' })`
- Ensure status filter on Campaigns page includes "Archived" and shows archived campaigns when selected
- Add toast feedback: "Campaign archived" / "Campaign unarchived"
- Hide Archive for already-archived campaigns; show Unarchive instead

**Deliverables:**
- [ ] Archive from card menu
- [ ] Unarchive from card menu and detail
- [ ] Status filter shows archived
- [ ] Toast feedback

---

### Sprint 2: Delete UI
**Duration:** 2 days

- Add Delete action to campaign card menu (only when status is `draft`)
- Add Delete action to Campaign Detail page header/actions (only when status is `draft`)
- Implement confirmation dialog: title "Delete campaign?", body "This cannot be undone. All draft assets will be removed."
- Wire Delete to `deleteCampaign(id)` after confirmation
- Add toast: "Campaign deleted"
- Redirect to Campaigns list after delete if on detail page
- Ensure Delete is visually secondary (e.g. destructive outline or text button)

**Deliverables:**
- [ ] Delete from card menu (drafts only)
- [ ] Delete from detail page (drafts only)
- [ ] Confirmation dialog
- [ ] Redirect after delete

---

### Sprint 3: Polish & Edge Cases
**Duration:** 1–2 days

- Ensure card menu has consistent ordering: Archive/Unarchive, then Delete (when applicable)
- Add loading state during archive/unarchive/delete
- Handle errors: show toast on failure; do not close modal on delete failure
- Ensure keyboard: Escape closes confirmation dialog without deleting
- Add aria-labels for accessibility

**Deliverables:**
- [ ] Consistent menu ordering
- [ ] Loading and error states
- [ ] Keyboard support
- [ ] Aria-labels

---

## Acceptance Criteria

- [ ] Archive available from campaign card and detail for non-archived campaigns
- [ ] Unarchive available from campaign card and detail for archived campaigns
- [ ] Delete available only for draft campaigns, with confirmation
- [ ] Status filter includes Archived and displays archived campaigns
- [ ] Archive is uncapped (no limit)
- [ ] Delete is irreversible and clearly warned

---

## Screens Affected

- Campaigns (`/app/campaigns`) — card menu, status filter
- Campaign Detail (`/app/campaigns/:id`) — header actions

---

## Dependencies

- `campaignStore.updateCampaign`, `campaignStore.deleteCampaign`
- Campaign status filter (PRD03)
- `Dialog` or `AlertDialog` for delete confirmation
- Toast for feedback

---

## Out of Scope (This Phase)

- Archive limit (decided: uncapped for now)
- Bulk archive/delete
- 48h inactivity reminders (PRD03 feature bank)
