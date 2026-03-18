# Jigi App UI Improvement Phases

## Complete Screen Inventory

### Public / Marketing
| Screen | Route | Purpose |
|--------|-------|---------|
| Landing Page | `/` | Marketing homepage with hero, features, testimonials, ROI, CTA |
| Login | `/login` | User sign-in |
| Signup | `/signup` | User registration |
| Reset Password | `/reset-password` | Request password reset |
| Reset Password Confirm | `/reset-password-confirm` | Complete password reset |

### Setup / Onboarding
| Screen | Route | Purpose |
|--------|-------|---------|
| Organisation Setup | `/setup/organisation` | Create/join organisation |
| Journey Choice | `/setup/journey` | Choose brand-first or idea-first |
| Quick Start | `/app/quick-start` | Guided entry point |
| Onboarding | `/app/onboarding` | Brand profile creation wizard |

### App Shell (Shared Layout)
| Component | Location | Purpose |
|-----------|----------|---------|
| Header | Fixed top-right | Page title, search, CTAs, notifications, user avatar |
| Sidebar | Fixed left | Logo, nav sections (Create, Manage, Review, System), Recent campaigns, user profile |
| Main Content | Below header, right of sidebar | Page-specific content |

### App Screens
| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `/app/dashboard` | Welcome, quick actions, stats (Pending/Active/Approved), Pending Reviews widget, Recent Campaigns, Generation Mix |
| Campaigns | `/app/campaigns` | List campaigns with search, filter, grid/list view |
| Campaign Create | `/app/campaigns/new` | Create new campaign form |
| Campaign Detail | `/app/campaigns/:id` | Campaign overview, GenerationPanel (Concepts/Copy/Images tabs), assets |
| Brands | `/app/brands` | List brand cards with status |
| Brand Profile | `/app/brands/:id` | Brand details, identity, voice, strategy |
| Approved Assets | `/app/approved` | Grid/list of approved assets by campaign, search, download |
| Review Queue | `/app/review` | Pending review cards, status filter, recently reviewed |
| Asset Review | `/app/review/:assetId` | Single asset review with approve/reject/request changes |
| Settings | `/app/settings` | Profile, Notifications, Team, API tabs |

---

## Per-Screen Improvement Outline

### Landing Page
- **Header:** Add sticky behavior with blur on scroll; ensure branding is prominent; add mobile hamburger menu
- **Sections:** Add scroll-triggered animations; improve spacing rhythm; ensure consistent card styling
- **CTAs:** Add hover states and transitions; improve contrast and hierarchy
- **Mobile:** Ensure sections stack cleanly; test touch targets; add collapsible FAQ if present

### Auth Screens (Login, Signup, Reset Password, Reset Password Confirm)
- **Layout:** Consistent AuthLayout with branding; add subtle background pattern or gradient
- **Forms:** Improve focus states; add smooth transitions on validation; consistent error styling
- **Links:** Clear visual hierarchy for "Forgot password", "Sign up"; hover states

### Setup Screens (Organisation Setup, Journey Choice)
- **Flow:** Clear step indicators; progress feedback; consistent card styling
- **Journey Choice:** Make option cards more visually distinct; add icons and short descriptions

### Quick Start & Onboarding
- **Quick Start:** Add visual progress; improve step cards; add sample data previews
- **Onboarding:** Wizard steps with clear navigation; improve form field grouping; add tooltips where helpful

### Header
- **Branding:** Ensure logo is visible; consider adding breadcrumbs on detail pages
- **Search:** Add keyboard shortcut hint; improve focus state; consider command palette (Cmd+K)
- **CTAs:** Only on Dashboard—ensure they stand out; add hover/active states
- **User Profile:** Add dropdown menu (profile, settings, sign out); improve avatar styling
- **Mobile:** Collapse to hamburger; show key actions; ensure touch targets

### Sidebar
- **Collapsible:** Add toggle to collapse to icon-only mode; persist state (localStorage)
- **Categorization:** Current sections (Create, Manage, Review, System) are good; ensure section headers are visually distinct
- **Active State:** Clear active indicator; consider subtle left border or background
- **Recent Campaigns:** Add "Clear" or limit display; improve truncation
- **User Profile:** Match Header dropdown for consistency
- **Mobile:** Overlay drawer; close on navigation; ensure full-width touch targets

### Dashboard
- **Welcome:** Larger greeting; add date/time context; improve subtitle
- **Quick Actions:** Primary CTA (New Campaign) larger; group secondary actions; add hover transitions
- **Stats:** Fix StatCard icon colors (orange/blue/green per stat); add trend indicators if data available; improve card shadows
- **Widgets:** Add hover states on cards; improve empty states; add "View all" transitions
- **Layout:** Responsive grid; consider reordering on mobile (stats first, then reviews, then campaigns)

### Campaigns
- **Header:** Consistent with other list pages; improve "New campaign" button prominence
- **Search:** Add debounce; improve placeholder; consider filter chips
- **Filter:** Filter button is non-functional—wire up or remove; add status/date filters
- **View Toggle:** Improve grid/list toggle styling; add transition
- **Cards:** Add hover shadow; improve status badge placement; add campaign thumbnail if available
- **Empty State:** Improve illustration and CTA

### Campaign Create
- **Form:** Improve field grouping; add progress indicator for multi-step; improve validation feedback
- **Layout:** Consider stepper for long forms; improve spacing

### Campaign Detail
- **Overview:** Add campaign health/progress summary at top; improve status display
- **GenerationPanel:** Improve tab styling; add brand include chips (already done); improve loading states
- **Assets:** Improve card grid; add hover states; improve empty states per tab

### Brands
- **List:** Improve card layout; add brand colour swatches; improve status badges
- **Empty State:** Improve CTA and illustration
- **Search/Filter:** Add if multiple brands; consider grid vs list

### Brand Profile
- **Sections:** Improve card grouping for Identity, Voice, Strategy; add visual hierarchy
- **Colours:** Show colour swatches prominently; improve tone chips
- **Edit Flow:** Consider inline edit vs modal; improve save feedback

### Approved Assets
- **Search:** Improve search UX; add filter by type (concept/copy/image)
- **View Toggle:** Improve grid/list; ensure list view is useful
- **Cards:** Add hover states; improve download button; add preview on hover
- **Grouping:** Improve campaign group headers; add expand/collapse
- **Modal:** Improve AssetDetailModal layout; add transitions

### Review Queue
- **Filters:** Improve filter UI; add sort (oldest first, etc.); consider tabs for status
- **Cards:** Add hover states; improve "Start review" CTA; show asset type icons
- **Recently Reviewed:** Improve section styling; add timestamps
- **Empty State:** Improve "All caught up" design

### Asset Review
- **Layout:** Improve split between preview and actions; ensure responsive
- **Actions:** Improve button hierarchy (Approve primary, Reject secondary, Request changes outline)
- **Comments:** Improve comment thread styling; add transitions
- **Navigation:** Add prev/next asset navigation; improve breadcrumb

### Settings
- **Tabs:** Improve tab styling; ensure active state is clear
- **Profile:** Improve form layout; add avatar upload placeholder
- **Appearance:** Improve dark mode toggle; add preview if possible
- **Sections:** Consistent card styling across tabs

---

## Design System Alignment

All screens should align with:

- **Color scheme:** Jigi brand (teal `#0D9488`, cream `#FEFDFB`, stone `#78716C`); use CSS variables, not hardcoded hex
- **Typography:** Plus Jakarta Sans; consistent scale (e.g. `text-3xl` page titles, `text-lg` section titles, `text-sm` labels)
- **Spacing:** Use `space-y-*` and `gap-*` consistently; avoid arbitrary `mb-8` everywhere
- **Shadows:** Use `shadow-card` and `shadow-card-hover` from globals.css
- **Transitions:** Add `transition-colors`, `transition-shadow`, `duration-200` on interactive elements
- **Hover states:** All clickable elements should have visible hover feedback

---

## Phased Implementation Plan

### Phase 1: App Shell & Foundation (Header, Sidebar, Layout)
**Goal:** Establish responsive, collapsible shell with consistent branding and user access.

- Add collapsible sidebar (toggle button, icon-only collapsed state, persist to localStorage)
- Add sidebar collapse/expand animation
- Implement mobile-responsive sidebar (overlay drawer, hamburger in header)
- Update Header: add user dropdown (profile, settings, sign out); improve search focus state
- Update AppLayout: dynamic `marginLeft` based on sidebar state; add mobile main padding
- Replace hardcoded colors in Sidebar/Header with design tokens (`text-foreground`, `bg-muted`, `border-border`)
- Add smooth transitions on layout changes

**Screens affected:** All app screens (via shared layout)

---

### Phase 2: Dashboard Overhaul
**Goal:** Make the dashboard the engaging, metric-focused hub described in the guidance.

- Redesign welcome section: larger greeting, date context, improved subtitle
- Restructure quick actions: primary CTA (New Campaign) larger; group secondary actions; add hover transitions
- Fix StatCard: apply `iconClassName` to icon color; use semantic colors (orange Pending, blue Active, green Approved)
- Add hover states and shadows to all dashboard cards
- Improve empty states: consistent icon + message + CTA pattern
- Add optional chart/visualization placeholder for "Approved This Week" trend (e.g. sparkline or bar)
- Improve responsive grid: stats full-width on mobile; reorder widgets for small screens
- Add subtle entrance animations for widgets (fade-in, stagger)

**Screens affected:** Dashboard

---

### Phase 3: List Pages (Campaigns, Brands, Approved Assets, Review Queue)
**Goal:** Consistent, interactive list experience with filters, search, and sorting.

- **Campaigns:** Wire up or remove Filter button; add status/date filters; improve card hover states; add sort dropdown (name, date, status)
- **Brands:** Add search if 5+ brands; improve card layout with colour swatches; consistent empty state
- **Approved Assets:** Add filter by type (concept/copy/image); improve search; add sort (date, campaign, type); improve card hover and download UX
- **Review Queue:** Improve filter UI; add sort (oldest first, campaign); improve card styling; improve "Recently Reviewed" section
- Standardize page header pattern: `h1` + subtitle + primary CTA
- Standardize search/filter bar: consistent placement, styling, and behavior
- Add loading skeletons that match final layout
- Ensure view toggle (grid/list) works and is styled consistently

**Screens affected:** Campaigns, Brands, Approved Assets, Review Queue

---

### Phase 4: Detail & Form Pages (Campaign Detail, Campaign Create, Brand Profile)
**Goal:** Improve content hierarchy, form UX, and generation flows.

- **Campaign Detail:** Add campaign summary card at top (status, progress, last updated); improve GenerationPanel tab styling; improve asset cards; add breadcrumb
- **Campaign Create:** Improve form grouping; add optional stepper for long forms; improve validation feedback; add progress indicator
- **Brand Profile:** Improve section cards (Identity, Voice, Strategy); prominent colour swatches; improve tone chips; consider inline edit patterns
- Add consistent "Back" or breadcrumb navigation
- Improve loading states (skeleton matching layout)
- Add hover states on all interactive elements

**Screens affected:** Campaign Detail, Campaign Create, Brand Profile

---

### Phase 5: Asset Review & Modals
**Goal:** Polished review experience and modal consistency.

- **Asset Review:** Improve split layout; primary Approve, secondary Reject, outline Request changes; improve comment thread; add prev/next asset navigation
- **AssetDetailModal (Approved Assets):** Improve layout; add transitions; ensure responsive
- **ImagePreviewModal, ConceptDetailModal, CopyDetailModal:** Consistent styling; add open/close transitions
- Standardize modal overlay and close behavior
- Add keyboard support (Escape to close)

**Screens affected:** Asset Review, Approved Assets (modal), Campaign Detail (modals)

---

### Phase 6: Auth & Setup Screens
**Goal:** Cohesive, professional auth and onboarding experience.

- **Auth (Login, Signup, Reset Password):** Improve AuthLayout; add subtle background; improve form focus states; consistent link styling
- **Organisation Setup:** Improve step clarity; add progress indicator
- **Journey Choice:** Improve option cards; add icons and short descriptions; hover states
- **Quick Start:** Add progress indicator; improve step cards
- **Onboarding:** Improve wizard steps; form field grouping; optional tooltips
- Ensure all forms have consistent validation feedback and error styling

**Screens affected:** Login, Signup, Reset Password, Reset Password Confirm, Organisation Setup, Journey Choice, Quick Start, Onboarding

---

### Phase 7: Settings & Utility Pages
**Goal:** Polished settings and supporting pages.

- **Settings:** Improve tab styling; consistent card layout across tabs; improve dark mode toggle; add optional section icons
- Ensure all Settings tabs have consistent structure
- Add hover states on interactive elements
- Improve form layouts (Profile, Notifications, Team, API)

**Screens affected:** Settings

---

### Phase 8: Landing Page & Marketing
**Goal:** Engaging, conversion-focused landing experience.

- Add sticky navbar with blur on scroll
- Add scroll-triggered animations for sections
- Improve CTA buttons: hover states, transitions
- Ensure mobile: hamburger menu, stacked sections, touch-friendly
- Improve section spacing and typography hierarchy
- Add optional micro-interactions (hover on feature cards, testimonial carousel)

**Screens affected:** Landing Page

---

### Phase 9: Design Token & Color Cleanup
**Goal:** Eliminate hardcoded colors; ensure dark mode readiness.

- Audit all screens for `#1C1917`, `#78716C`, `#E8E5DF`, `#0D9488`, `gray-*` usage
- Replace with `text-foreground`, `text-muted-foreground`, `border-border`, `primary`, `bg-muted`, etc.
- Ensure StatCard and widget-specific colors use semantic tokens or CSS variables
- Verify dark mode works across all screens
- Document design tokens in a single reference

**Screens affected:** All

---

### Phase 10: Polish & Accessibility
**Goal:** Smooth interactions, accessibility, and final QA.

- Add `transition-colors`, `transition-shadow` (200ms) to all interactive elements
- Ensure focus states are visible (ring, outline)
- Add `aria-label` where needed; verify keyboard navigation
- Test mobile breakpoints (320px, 768px, 1024px)
- Add optional reduced-motion support
- Final pass: loading states, empty states, error states
- Optional: add subtle page transition when navigating

**Screens affected:** All

---

## Summary

| Phase | Focus | Screens |
|-------|-------|---------|
| 1 | App Shell (Header, Sidebar, Layout) | All app |
| 2 | Dashboard | Dashboard |
| 3 | List Pages | Campaigns, Brands, Approved Assets, Review Queue |
| 4 | Detail & Form Pages | Campaign Detail, Campaign Create, Brand Profile |
| 5 | Asset Review & Modals | Asset Review, modals |
| 6 | Auth & Setup | Login, Signup, Reset, Setup, Quick Start, Onboarding |
| 7 | Settings | Settings |
| 8 | Landing Page | Landing |
| 9 | Design Token Cleanup | All |
| 10 | Polish & Accessibility | All |

**Note:** The guidance requested "client-side only with no backend integration, API calls, authentication, routing, or data persistence." This document assumes improvements to the **existing app**, which has auth, routing, and API integration. If the goal is a **standalone prototype** with mock data and no backend, Phases 1–8 would be adapted to use static/sample data and client-side routing only, with auth simulated via local state.
