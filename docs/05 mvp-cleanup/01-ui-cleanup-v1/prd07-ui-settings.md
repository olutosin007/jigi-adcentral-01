# PRD 07 — UI Settings Page

**Status:** Draft  
**Version:** 1.0  
**Phase:** 7 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Polish the Settings page with improved tab styling, consistent card layout, and better form UX. Settings is a utility page that should feel organized and professional.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Clear tab styling | Active tab is obvious; tabs feel interactive |
| Consistent cards | Profile, Notifications, Team, API tabs share card structure |
| Form polish | Inputs, switches, buttons are consistent |
| Dark mode toggle | Clear and accessible |

---

## User Stories

### As a user managing settings
- I want to easily switch between Profile, Notifications, Team, API
- I want forms to feel organized
- I want the dark mode toggle to be clear

---

## Sprints

### Sprint 1: Tabs & Profile Section
**Duration:** 2 days

- Improve TabsList styling: clearer active state; hover states; consistent with design system
- Improve Profile card: form layout (grid for name fields); consistent label/input spacing
- Add optional avatar upload placeholder (visual only; no backend)
- Improve "Save changes" button: loading state; success feedback
- Ensure Appearance card (dark mode) is clear: label, description, switch

**Deliverables:**
- [ ] Tab styling improved
- [ ] Profile form layout
- [ ] Dark mode toggle clear
- [ ] Save feedback

---

### Sprint 2: Notifications, Team, API Tabs
**Duration:** 2 days

- Ensure Notifications tab has consistent card layout
- Ensure Team tab has consistent card layout
- Ensure API tab has consistent card layout
- Add section icons if helpful (Bell, Users, Key)
- Add hover states on interactive elements
- Ensure empty or placeholder states are styled

**Deliverables:**
- [ ] All tabs have consistent structure
- [ ] Section icons (optional)
- [ ] Hover states
- [ ] Placeholder states styled

---

## Acceptance Criteria

- [ ] Tabs have clear active state
- [ ] All tabs share consistent card layout
- [ ] Forms are polished
- [ ] Dark mode toggle is clear

---

## Screens Affected

Settings (`/app/settings`)

---

## Dependencies

- `Settings` page
- `Tabs`, `Card`, `Input`, `Switch`, `Button`
- `useThemeStore`
