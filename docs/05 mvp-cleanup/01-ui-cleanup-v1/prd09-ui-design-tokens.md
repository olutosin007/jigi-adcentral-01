# PRD 09 — UI Design Token Cleanup

**Status:** Draft  
**Version:** 1.0  
**Phase:** 9 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Eliminate hardcoded colors across the app and ensure dark mode readiness. All screens should use design tokens (CSS variables) instead of hex values or `gray-*` utilities where semantic tokens exist.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| No hardcoded hex | Replace `#1C1917`, `#78716C`, `#E8E5DF`, `#0D9488` with tokens |
| Semantic tokens | Use `text-foreground`, `text-muted-foreground`, `border-border`, `primary`, `bg-muted` |
| Dark mode | All screens render correctly in dark mode |
| Documentation | Design tokens documented in single reference |

---

## User Stories

### As a developer
- I want to know which tokens to use for each color
- I want dark mode to work without extra effort

### As a user
- I want the app to look consistent in light and dark mode

---

## Sprints

### Sprint 1: Audit & Shell Replacement
**Duration:** 2 days

- Audit codebase for hardcoded colors: `#1C1917`, `#78716C`, `#E8E5DF`, `#0D9488`, `#F5F4F0`, `#F0FDFA`, `gray-*` where semantic alternative exists
- Create mapping: hex → token
- Replace in Sidebar, Header, AppLayout
- Replace in Dashboard (QuickStatsWidget, StatCard, etc.)
- Verify no visual regressions

**Deliverables:**
- [ ] Audit complete
- [ ] Shell components use tokens
- [ ] Dashboard uses tokens

---

### Sprint 2: List Pages Replacements
**Duration:** 2 days

- Replace hardcoded colors in Campaigns, Brands, Approved Assets, Review Queue
- Replace `gray-*` with `muted`, `muted-foreground`, `border` where appropriate
- Ensure status badges use semantic tokens where possible (e.g. `destructive`, `warning`, `success`)
- Verify dark mode works

**Deliverables:**
- [ ] List pages use tokens
- [ ] Dark mode verified

---

### Sprint 3: Detail Pages & Remaining
**Duration:** 2 days

- Replace in Campaign Detail, Campaign Create, Brand Profile
- Replace in Asset Review, modals
- Replace in Auth, Setup, Settings, Landing
- Replace in shared components (EmptyState, Badge, etc.)
- Ensure widget-specific colors (e.g. StatCard orange/blue/green) use CSS variables or semantic tokens

**Deliverables:**
- [ ] All pages use tokens
- [ ] Shared components updated

---

### Sprint 4: Documentation & Dark Mode Verification
**Duration:** 1–2 days

- Create `docs/DESIGN-TOKENS.md` (or add to existing): list all tokens, usage, examples
- Document: `--background`, `--foreground`, `--primary`, `--muted`, `--border`, etc.
- Verify dark mode across all screens: toggle theme; check each major route
- Fix any dark mode issues (contrast, visibility)

**Deliverables:**
- [ ] Design token reference document
- [ ] Dark mode verified
- [ ] Issues fixed

---

## Acceptance Criteria

- [ ] No hardcoded hex in UI components
- [ ] Semantic tokens used consistently
- [ ] Dark mode works across all screens
- [ ] Design tokens documented

---

## Screens Affected

All screens

---

## Dependencies

- `globals.css` tokens
- All UI components
