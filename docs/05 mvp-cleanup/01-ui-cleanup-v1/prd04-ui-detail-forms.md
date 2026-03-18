# PRD 04 — UI Detail & Form Pages

**Status:** Draft  
**Version:** 1.0  
**Phase:** 4 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Improve content hierarchy, form UX, and generation flows on Campaign Detail, Campaign Create, and Brand Profile. These pages are high-traffic and need clear navigation, loading states, and polished interactions.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Clear hierarchy | Campaign Detail has summary at top; breadcrumb or Back navigation |
| Form usability | Campaign Create has logical grouping; validation feedback is clear |
| Brand profile clarity | Identity, Voice, Strategy sections are visually distinct; colour swatches prominent |

---

## User Stories

### As a user viewing a campaign
- I want to see campaign status and progress at a glance
- I want to navigate back to the campaign list easily
- I want clear tab styling in the GenerationPanel

### As a user creating a campaign
- I want the form to feel organized and not overwhelming
- I want clear validation messages when something is wrong

### As a user viewing a brand profile
- I want to see brand colours prominently
- I want to understand the brand voice (tone chips) at a glance

---

## Sprints

### Sprint 1: Campaign Detail
**Duration:** 3 days

- Add campaign summary card at top: status badge, progress (e.g. X/Y assets approved), last updated
- Add breadcrumb or Back link: Campaigns > [Campaign Name]
- Improve GenerationPanel tab styling: clearer active state; consistent spacing
- Improve asset cards (ConceptCard, CopyCard, ImageCard): hover states; consistent badge placement
- Improve empty states per tab (Concepts, Copy, Images)
- Add loading skeleton for campaign data

**Deliverables:**
- [ ] Summary card at top
- [ ] Breadcrumb or Back navigation
- [ ] Tab styling improved
- [ ] Asset card hover states
- [ ] Loading skeleton

---

### Sprint 2: Campaign Create
**Duration:** 2–3 days

- Improve form field grouping: logical sections (e.g. Basics, Brief, Channels)
- Add optional stepper if form is long: Step 1 of 3, etc.
- Improve validation feedback: inline errors; focus on first invalid field
- Improve spacing: consistent `space-y-6` between sections
- Add progress indicator or step labels
- Ensure primary submit button is prominent

**Deliverables:**
- [ ] Form sections grouped
- [ ] Validation feedback improved
- [ ] Spacing and layout polished

---

### Sprint 3: Brand Profile
**Duration:** 2–3 days

- Improve section cards: Identity, Voice, Strategy with clear headers and icons
- Add prominent colour swatches: primary, secondary, accent as larger visual blocks
- Improve tone chips: consistent with ToneStep styling; hover states
- Consider inline edit pattern for editable fields (or keep read-only with Edit button)
- Improve save feedback (toast or inline success)
- Add hover states on interactive elements

**Deliverables:**
- [ ] Section cards with hierarchy
- [ ] Colour swatches prominent
- [ ] Tone chips styled
- [ ] Save feedback

---

## Acceptance Criteria

- [ ] Campaign Detail has summary and breadcrumb
- [ ] Campaign Create has logical form grouping
- [ ] Brand Profile has clear sections and colour swatches
- [ ] All pages have loading states and hover states

---

## Screens Affected

- Campaign Detail (`/app/campaigns/:id`)
- Campaign Create (`/app/campaigns/new`)
- Brand Profile (`/app/brands/:id`)

---

## Dependencies

- `CampaignDetail`, `CampaignCreate`, `BrandProfile` pages
- `GenerationPanel`, `ConceptCard`, `CopyCard`, `ImageCard`
- Form components, validation schemas
