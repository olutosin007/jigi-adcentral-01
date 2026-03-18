# PRD 01 — UI Shell Foundation

**Status:** Draft  
**Version:** 1.0  
**Phase:** 1 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Establish a responsive, collapsible app shell with consistent branding and user access. The Header, Sidebar, and Main layout form the foundation for all app screens and must support desktop (expanded/collapsed sidebar) and mobile (overlay drawer).

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Collapsible sidebar | User can toggle sidebar to icon-only; state persists across sessions |
| Mobile responsiveness | Sidebar becomes overlay drawer; hamburger in header; touch-friendly |
| User profile access | Header and Sidebar expose profile dropdown (profile, settings, sign out) |
| Design consistency | Shell uses design tokens; no hardcoded hex colors |

---

## User Stories

### As a desktop user
- I want to collapse the sidebar to gain more content space
- I want my sidebar preference to persist when I return
- I want quick access to my profile and settings from the header

### As a mobile user
- I want the sidebar to open as an overlay so I can access navigation
- I want a clear way to open and close the sidebar
- I want touch-friendly tap targets

---

## Sprints

### Sprint 1: Collapsible Sidebar (Desktop)
**Duration:** 3–5 days

- Add sidebar collapse toggle button (chevron or hamburger icon)
- Implement collapsed state: icon-only nav (labels hidden); width ~64px
- Add expand/collapse animation (transition width 200ms)
- Persist state to localStorage (`jigi-sidebar-collapsed`)
- Update AppLayout: dynamic `marginLeft` based on sidebar state (240px vs 64px)
- Ensure nav items show icon + tooltip when collapsed

**Deliverables:**
- [ ] Sidebar collapses to icon-only
- [ ] Toggle button visible and accessible
- [ ] State persists on reload
- [ ] Main content area resizes smoothly

---

### Sprint 2: Mobile Sidebar (Overlay Drawer)
**Duration:** 3–5 days

- Add mobile breakpoint detection (e.g. &lt; 768px)
- On mobile: sidebar hidden by default; show as overlay when opened
- Add hamburger button in Header (visible on mobile only)
- Overlay: full-height drawer from left; backdrop dims main content
- Close drawer on: navigation, backdrop click, Escape key
- Ensure drawer has slide-in animation
- Update AppLayout: on mobile, main content full-width; no fixed marginLeft

**Deliverables:**
- [ ] Hamburger visible on mobile
- [ ] Sidebar opens as overlay
- [ ] Backdrop + close on navigation
- [ ] Touch-friendly tap targets

---

### Sprint 3: Header Improvements
**Duration:** 2–3 days

- Add user profile dropdown: trigger = avatar; menu items = Profile, Settings, Sign out
- Implement dropdown (use existing DropdownMenu or similar)
- Improve search input: focus ring, placeholder; optional keyboard shortcut hint (e.g. ⌘K)
- Ensure CTAs (Dashboard only) have hover/active states
- On mobile: show hamburger; optionally hide or simplify search

**Deliverables:**
- [ ] User dropdown with Profile, Settings, Sign out
- [ ] Search focus state improved
- [ ] CTA hover states

---

### Sprint 4: Shell Design Token Cleanup
**Duration:** 2 days

- Replace hardcoded colors in Sidebar: `#1C1917` → `text-foreground`, `#78716C` → `text-muted-foreground`, `#E8E5DF` → `border-border`, `#0D9488` → `primary`, `#F0FDFA` → `bg-primary/5`
- Replace hardcoded colors in Header: same mapping
- Add smooth transitions on layout changes (`transition-all duration-200`)
- Verify dark mode works for Sidebar and Header

**Deliverables:**
- [ ] No hardcoded hex in Sidebar/Header
- [ ] Transitions on layout changes
- [ ] Dark mode verified

---

## Acceptance Criteria

- [ ] Sidebar collapses to icon-only; state persists
- [ ] Mobile: sidebar is overlay drawer; hamburger in header
- [ ] User dropdown in Header with Profile, Settings, Sign out
- [ ] Shell uses design tokens; dark mode works
- [ ] All interactive elements have hover/focus states

---

## Screens Affected

All app screens (via shared AppLayout, Header, Sidebar)

---

## Dependencies

- Existing `AppLayout`, `Header`, `Sidebar` components
- Design tokens in `globals.css`
- `localStorage` for persistence
