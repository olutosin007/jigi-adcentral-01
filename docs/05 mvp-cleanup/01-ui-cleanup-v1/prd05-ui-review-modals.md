# PRD 05 — UI Asset Review & Modals

**Status:** Draft  
**Version:** 1.0  
**Phase:** 5 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Polish the Asset Review experience and standardize modal behavior across the app. Asset Review is a critical workflow; modals (AssetDetailModal, ImagePreviewModal, ConceptDetailModal, CopyDetailModal) should have consistent styling and interactions.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Clear action hierarchy | Approve primary, Reject secondary, Request changes outline |
| Modal consistency | All modals share overlay, transitions, Escape to close |
| Navigation | Prev/next asset navigation in Asset Review |
| Keyboard support | Escape closes modals |

---

## User Stories

### As a reviewer
- I want to quickly approve or reject with clear button hierarchy
- I want to move to the next asset without going back to the queue
- I want comments to be easy to read and add

### As a user viewing asset details
- I want modals to feel consistent across the app
- I want to close with Escape or backdrop click

---

## Sprints

### Sprint 1: Asset Review Layout & Actions
**Duration:** 3 days

- Improve split layout: preview area vs actions/comments; ensure responsive (stack on mobile)
- Improve action buttons: Approve = primary (green/teal); Reject = secondary (destructive); Request changes = outline
- Improve comment thread: consistent styling; transitions on new comments
- Add breadcrumb: Review Queue > [Campaign] > [Asset]
- Ensure loading state for asset data
- Add hover states on all buttons

**Deliverables:**
- [ ] Layout improved; responsive
- [ ] Button hierarchy clear
- [ ] Comment thread styled
- [ ] Breadcrumb added

---

### Sprint 2: Modal Standardization
**Duration:** 2–3 days

- Audit AssetDetailModal, ImagePreviewModal, ConceptDetailModal, CopyDetailModal
- Standardize: overlay (backdrop), content container (rounded, shadow), close button
- Add open/close transitions: fade + scale or slide
- Ensure Escape key closes modal
- Ensure backdrop click closes modal (where appropriate)
- Improve AssetDetailModal layout: ensure responsive; consistent with other modals

**Deliverables:**
- [ ] All modals use consistent overlay and container
- [ ] Open/close transitions
- [ ] Escape and backdrop close
- [ ] AssetDetailModal layout improved

---

### Sprint 3: Prev/Next Navigation & Keyboard
**Duration:** 2 days

- Add prev/next asset buttons in Asset Review (when multiple assets in queue)
- Navigate without full page reload (use router or state)
- Add keyboard shortcuts: Arrow Left = prev, Arrow Right = next (when not in input)
- Ensure focus management: focus first focusable element on open; trap focus within modal
- Add aria-labels for accessibility

**Deliverables:**
- [ ] Prev/next navigation
- [ ] Keyboard shortcuts
- [ ] Focus management
- [ ] Aria-labels

---

## Acceptance Criteria

- [ ] Asset Review has clear action hierarchy
- [ ] All modals have consistent styling and behavior
- [ ] Escape closes modals
- [ ] Prev/next navigation in Asset Review
- [ ] Keyboard support

---

## Screens Affected

- Asset Review (`/app/review/:assetId`)
- Approved Assets (AssetDetailModal)
- Campaign Detail (ImagePreviewModal, ConceptDetailModal, CopyDetailModal)

---

## Dependencies

- `AssetReview` page, `AssetPreviewArea`, `AssetDetailsSidebar`
- Modal components (Dialog, or custom)
- `useReviewQueue`, asset data hooks
