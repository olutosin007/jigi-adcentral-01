# PRD 02 — UI Dashboard Overhaul

**Status:** Draft  
**Version:** 1.0  
**Phase:** 2 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Transform the Dashboard into an engaging, metric-focused hub with clear visual hierarchy, improved stats, and polished widgets. The dashboard is the primary landing experience for authenticated users.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Engaging welcome | Greeting is prominent; date context; clear subtitle |
| Clear action hierarchy | Primary CTA (New Campaign) stands out; secondary actions grouped |
| Accurate stat visuals | StatCard icons use semantic colors (orange/blue/green) |
| Polished widgets | Cards have hover states; empty states are consistent |

---

## User Stories

### As a returning user
- I want to see a welcoming greeting and understand what's happening today
- I want to quickly start a new campaign or access key actions
- I want to see my pending reviews and recent campaigns at a glance

### As a new user
- I want clear guidance when I have no data yet
- I want an obvious path to create my first campaign

---

## Sprints

### Sprint 1: Welcome & Quick Actions Redesign
**Duration:** 2–3 days

- Redesign welcome section: `text-3xl` greeting; add date (e.g. "Monday, 8 March"); improve subtitle
- Restructure quick actions: New Campaign as primary (larger, filled); Quick Idea, Manage Brands, Pending Review as secondary (outline)
- Add hover transitions (`transition-colors duration-200`) to all action buttons
- Group secondary actions visually (e.g. flex wrap with gap)
- Ensure Pending Review button only shows when count &gt; 0; use accent styling (orange border/background)

**Deliverables:**
- [ ] Larger greeting with date
- [ ] Primary CTA visually dominant
- [ ] Hover states on all buttons

---

### Sprint 2: StatCard Fixes & Card Hover States
**Duration:** 2–3 days

- Fix StatCard: apply `iconClassName` to both background and icon color (currently icon always teal)
- Use semantic colors: Pending Review = orange (`bg-orange-50`, `text-orange-600`); Active Campaigns = blue; Approved This Week = green
- Add `shadow-card` and `shadow-card-hover` to StatCard; `transition-shadow duration-200`
- Add hover states to PendingReviewsWidget and RecentCampaignsWidget cards
- Add hover states to GenerationMixCard inner stat blocks
- Ensure all dashboard cards use consistent border and rounded corners

**Deliverables:**
- [ ] StatCard icons match semantic meaning
- [ ] Card hover shadows
- [ ] Consistent card styling

---

### Sprint 3: Empty States & Responsive Grid
**Duration:** 2–3 days

- Standardize empty state pattern: icon (in muted circle) + title + description + optional CTA
- Apply to PendingReviewsWidget ("You're all caught up!"), RecentCampaignsWidget ("No campaigns yet"), GenerationMixCard ("No assets generated yet")
- Improve responsive grid: on mobile, stats full-width; reorder so stats appear first, then Pending Reviews, then Recent Campaigns + Generation Mix
- Use `space-y-8` or `space-y-10` for section spacing instead of uniform `mb-8`
- Ensure widgets stack cleanly on small screens

**Deliverables:**
- [ ] Consistent empty state pattern
- [ ] Responsive grid reordering
- [ ] Improved spacing rhythm

---

### Sprint 4: Animations & Optional Chart Placeholder
**Duration:** 2 days

- Add subtle entrance animations: `animate-in fade-in slide-in-from-bottom-2` with stagger for widgets (use `animation-delay` or similar)
- Optional: Add sparkline or mini bar chart for "Approved This Week" if trend data available; otherwise add placeholder for future use
- Ensure animations respect `prefers-reduced-motion` (disable or simplify if set)

**Deliverables:**
- [ ] Staggered widget entrance (optional, can skip if no animation lib)
- [ ] Chart placeholder or defer to later phase
- [ ] Reduced-motion consideration

---

## Acceptance Criteria

- [ ] Welcome section is prominent with date context
- [ ] Primary CTA (New Campaign) is visually dominant
- [ ] StatCard icons use semantic colors
- [ ] All cards have hover states
- [ ] Empty states follow consistent pattern
- [ ] Dashboard is responsive on mobile

---

## Screens Affected

Dashboard (`/app/dashboard`)

---

## Dependencies

- `QuickStatsWidget`, `PendingReviewsWidget`, `RecentCampaignsWidget`, `GenerationMixCard`, `StatCard`
- `useDashboardStats`, `usePendingReviews`, `useRecentCampaigns`, `useGenerationMixStats`
- Design tokens (`shadow-card`, `shadow-card-hover`)
