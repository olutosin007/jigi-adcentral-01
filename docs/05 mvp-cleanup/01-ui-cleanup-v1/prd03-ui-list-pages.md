# PRD 03 — UI List Pages

**Status:** Draft  
**Version:** 1.0  
**Phase:** 3 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Deliver a consistent, interactive list experience across Campaigns, Brands, Approved Assets, and Review Queue. Each page will have standardized headers, search/filter/sort capabilities, and polished card layouts.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Consistent page pattern | All list pages share: h1 + subtitle + primary CTA; search/filter bar |
| Functional filters | Filter and sort are wired up where applicable |
| Polished cards | Cards have hover states; status badges are clear |
| Loading states | Skeletons match final layout |

---

## User Stories

### As a user browsing campaigns
- I want to search campaigns by name
- I want to filter by status and sort by date or name
- I want cards to feel interactive (hover feedback)

### As a user browsing brands
- I want to see brand colour swatches at a glance
- I want to search brands when I have many

### As a user browsing approved assets
- I want to filter by type (concept/copy/image) and search
- I want to sort by date, campaign, or type
- I want clear download actions

### As a user in the review queue
- I want to filter by status and sort by oldest first
- I want clear "Start review" CTAs

---

## Sprints

### Sprint 1: Campaigns Page
**Duration:** 3 days

- Standardize page header: `h1` (text-2xl) + subtitle + primary CTA (New campaign)
- Wire up Filter button: add status filter (draft, active, etc.) and optional date range; or remove if not needed
- Add sort dropdown: Name, Date updated, Status
- Add search debounce (300ms) if not present
- Improve campaign cards: hover shadow; consistent status badge placement; improve grid/list toggle styling
- Add loading skeleton that matches card grid layout
- Improve empty state: icon + message + CTA

**Deliverables:**
- [ ] Filter and sort functional or removed
- [ ] Card hover states
- [ ] Loading skeleton
- [ ] Empty state improved

---

### Sprint 2: Brands Page
**Duration:** 2–3 days

- Add search when brands.length >= 5; debounced input
- Improve card layout: add brand colour swatches (primary, secondary, accent as small circles or bars)
- Improve status badges (complete/partial/starter) with consistent styling
- Standardize empty state
- Ensure grid is responsive (1 col mobile, 2–3 cols desktop)

**Deliverables:**
- [ ] Search (conditional on count)
- [ ] Colour swatches on cards
- [ ] Consistent empty state

---

### Sprint 3: Approved Assets Page
**Duration:** 3–4 days

- Add filter by type: Concept, Copy, Image (chips or dropdown)
- Improve search: ensure it filters by asset name and campaign name
- Add sort: Date, Campaign, Type
- Improve card hover: shadow, preview on hover if feasible
- Improve download button: loading state, success feedback
- Improve campaign group headers: consider expand/collapse for large groups
- Ensure grid/list toggle works and is styled consistently

**Deliverables:**
- [ ] Type filter
- [ ] Sort options
- [ ] Card hover and download UX
- [ ] Group headers improved

---

### Sprint 4: Review Queue Page
**Duration:** 2–3 days

- Improve filter UI: ensure Select is styled consistently; consider tabs for status (All, Submitted, Brand Review)
- Add sort: Oldest first, Campaign name
- Improve card styling: hover states; asset type icons (concept/copy/image)
- Improve "Start review" CTA: primary button styling
- Improve "Recently Reviewed" section: timestamps, card styling
- Improve empty state ("All caught up!")

**Deliverables:**
- [ ] Filter and sort
- [ ] Card hover states
- [ ] Recently Reviewed section styled
- [ ] Empty state improved

---

## Acceptance Criteria

- [ ] All four pages share consistent header pattern
- [ ] Search, filter, sort are functional where specified
- [ ] Cards have hover states
- [ ] Loading skeletons match layout
- [ ] Empty states are consistent

---

## Screens Affected

- Campaigns (`/app/campaigns`)
- Brands (`/app/brands`)
- Approved Assets (`/app/approved`)
- Review Queue (`/app/review`)

---

## Dependencies

- `useCampaignStore`, `useBrandStore`, `useReviewQueue`, `useApprovedAssets`, etc.
- `EmptyState` component
- Design tokens
