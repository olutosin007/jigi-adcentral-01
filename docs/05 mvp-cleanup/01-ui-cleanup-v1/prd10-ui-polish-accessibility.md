# PRD 10 — UI Polish & Accessibility

**Status:** Draft  
**Version:** 1.0  
**Phase:** 10 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Final polish pass: transitions, hover states, focus states, keyboard navigation, and accessibility. Ensure the app feels smooth, is usable by keyboard and screen reader users, and works across mobile breakpoints.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Smooth interactions | Transitions on interactive elements |
| Visible focus | Focus ring/outline on all focusable elements |
| Keyboard nav | Tab order logical; Escape closes modals |
| Mobile QA | All breakpoints tested |
| Reduced motion | Respect `prefers-reduced-motion` |

---

## User Stories

### As a keyboard user
- I want to tab through the app logically
- I want to close modals with Escape
- I want focus to be visible

### As a screen reader user
- I want meaningful aria-labels where needed
- I want headings to be in logical order

### As a user who prefers reduced motion
- I want animations to be disabled or simplified when I set that preference

---

## Sprints

### Sprint 1: Transitions & Hover States
**Duration:** 2 days

- Add `transition-colors duration-200` to buttons, links, nav items
- Add `transition-shadow duration-200` to cards with hover states
- Audit all interactive elements: ensure hover feedback exists
- Add hover states where missing (e.g. secondary buttons, icon buttons)
- Ensure no jarring instant changes

**Deliverables:**
- [ ] Transitions on buttons, links, cards
- [ ] Hover states on all interactive elements

---

### Sprint 2: Focus States & Keyboard Navigation
**Duration:** 2–3 days

- Ensure all focusable elements have visible focus ring: `focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2` or equivalent
- Audit tab order: ensure logical flow (sidebar → main → content)
- Verify Escape closes modals
- Verify Enter/Space activates buttons and links
- Add `aria-label` where needed: icon-only buttons, close buttons
- Add `aria-current="page"` on active nav item (if not already)

**Deliverables:**
- [ ] Focus rings visible
- [ ] Tab order logical
- [ ] Keyboard shortcuts work
- [ ] Aria-labels added

---

### Sprint 3: Mobile QA & Breakpoints
**Duration:** 2 days

- Test at 320px, 375px, 768px, 1024px
- Verify: no horizontal scroll; touch targets ≥ 44px; text readable
- Fix any layout issues on small screens
- Verify sidebar drawer works on mobile
- Verify forms are usable on mobile

**Deliverables:**
- [ ] Breakpoints tested
- [ ] Mobile issues fixed
- [ ] Touch targets verified

---

### Sprint 4: Reduced Motion & Final Pass
**Duration:** 2 days

- Add `@media (prefers-reduced-motion: reduce)` overrides: disable or simplify animations
- Use `transition: none` or `animation: none` when reduced motion preferred
- Final pass: loading states (skeleton, spinner) consistent
- Final pass: empty states consistent
- Final pass: error states (form errors, API errors) styled

**Deliverables:**
- [ ] Reduced motion respected
- [ ] Loading/empty/error states consistent
- [ ] Final QA complete

---

## Acceptance Criteria

- [ ] Transitions on interactive elements
- [ ] Focus states visible
- [ ] Keyboard navigation works
- [ ] Mobile breakpoints verified
- [ ] Reduced motion supported
- [ ] Loading/empty/error states polished

---

## Screens Affected

All screens

---

## Dependencies

- All UI components
- Design tokens
- Browser support for `prefers-reduced-motion`
