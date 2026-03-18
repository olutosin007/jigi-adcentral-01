# UI Cleanup v1 — Progress

---

## PRD01: UI Shell Foundation

**PRD:** [prd01-ui-shell-foundation.md](prd01-ui-shell-foundation.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Collapsible Sidebar (Desktop) | Done | Toggle button, icon-only collapsed state, localStorage persist via useAppStore, AppLayout/Header dynamic margin, tooltips on nav when collapsed | |
| Sprint 2: Mobile Sidebar (Overlay Drawer) | Done | useIsMobile, Sheet overlay, hamburger in Header, close on navigation, touch targets (min-h-44px) | |
| Sprint 3: Header Improvements | Done | User dropdown (Profile, Settings, Sign out), search focus ring + ⌘K hint, CTA hover/active states | |
| Sprint 4: Shell Design Token Cleanup | Done | Replaced hex in Sidebar/Header with design tokens, transition-all duration-200, dark mode via tokens | |

---

## Implementation Summary

### Sprint 1
- **Sidebar.tsx:** Wired to `useAppStore` (sidebarCollapsed, toggleSidebar); added toggle button (PanelLeftClose/PanelLeft icons); collapsed state hides labels, section titles, recent campaign names, user name/role; Tooltip on nav items when collapsed; extracted `SidebarContent` component
- **AppLayout.tsx:** Reads `sidebarCollapsed` from useAppStore; main `marginLeft` dynamic (240/64)
- **Header.tsx:** Reads `sidebarCollapsed`; `left` dynamic (240/64); `transition-[left] duration-200`

### Sprint 2
- **AppLayout.tsx:** Added `useIsMobile`, `sidebarOpen` state; passes `isMobile`, `sidebarOpen`, `setSidebarOpen` to Sidebar and Header; main `marginLeft: 0` on mobile; `useEffect` closes drawer on `location.pathname` change
- **Sidebar.tsx:** When `isMobile`, renders `Sheet` with `SheetContent side="left"` containing `SidebarContent`; `onNavigate` closes drawer; `handleNavigate` calls `onMobileOpenChange(false)`
- **Header.tsx:** Added `isMobile`, `onMenuClick` props; hamburger button (MenuIcon) visible on mobile only; `min-h-[44px] min-w-[44px]` for touch targets
- **SidebarContent:** Added `min-h-[44px] md:min-h-0` to nav links for mobile touch targets

### Sprint 3
- **Header.tsx:** User avatar wrapped in `DropdownMenu`; menu items: Profile, Settings, Sign out (Sign out calls `signOut()` and navigates to `/`); search input: focus ring (`focus:ring-2 focus:ring-ring focus:ring-offset-2`), ⌘K keyboard hint; CTAs: `hover:bg-accent`, `active:scale-[0.98]` for press feedback; avatar hover/focus ring

### Sprint 4
- **Sidebar.tsx:** Replaced `#1C1917` → `text-foreground`, `#78716C` → `text-muted-foreground`, `#E8E5DF` → `border-border`, `#0D9488` → `primary`, `#F0FDFA` → `bg-primary/5`; added `transition-all duration-200` where needed; `bg-white` → `bg-background`
- **Header.tsx:** Same token replacements; `transition-[left]` → `transition-all duration-200`
- **globals.css:** Scrollbar, nav-item utilities, shadow vars use `var(--border)`, `var(--primary)`, etc.

---

## Files Changed

- `uiux/jigi-app/src/components/layout/Sidebar.tsx`
- `uiux/jigi-app/src/components/layout/AppLayout.tsx`
- `uiux/jigi-app/src/components/layout/Header.tsx`
- `uiux/jigi-app/src/styles/globals.css`

---

## PRD02: UI Dashboard Overhaul

**PRD:** [prd02-ui-dashboard-overhaul.md](prd02-ui-dashboard-overhaul.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Welcome & Quick Actions | Done | text-3xl greeting, date, primary CTA, secondary group, hover transitions, Pending Review accent | |
| Sprint 2: StatCard & Card Hover | Done | iconClassName for icon color, semantic colors (orange/blue/green), shadow-card/hover, widget hover states | |
| Sprint 3: Empty States & Grid | Done | Standardized empty pattern (icon + title + desc + CTA), space-y-10, responsive order | |
| Sprint 4: Animations | Done | Staggered animate-in fade-in slide-in-from-bottom-2, motion-reduce:animate-none | |
| Personalization | Done | getUserDisplayName (profile, metadata, email); greeting uses actual name | |

### Implementation Summary

- **Dashboard.tsx:** Welcome section with date (format date-fns), text-3xl greeting; quick actions: New Campaign primary (size-lg), secondary group; personalization via `getUserDisplayName(profile, user)`; space-y-10; staggered entrance animations with motion-reduce support
- **StatCard.tsx:** `iconClassName` applied to both wrapper and icon (inherits color); shadow-card, shadow-card-hover, transition-shadow
- **QuickStatsWidget.tsx:** Semantic iconClassName: orange (Pending), blue (Active), green (Approved)
- **PendingReviewsWidget, RecentCampaignsWidget, GenerationMixCard:** Card shadow/hover; inner item hover (bg-muted/50 → bg-muted); standardized empty states with icon in muted circle, title, description, optional CTA
- **GenerationMixCard:** Empty state CTA "New Campaign"; inner stat blocks hover states

### Files Changed

- `uiux/jigi-app/src/pages/Dashboard.tsx`
- `uiux/jigi-app/src/components/dashboard/StatCard.tsx`
- `uiux/jigi-app/src/components/dashboard/QuickStatsWidget.tsx`
- `uiux/jigi-app/src/components/dashboard/PendingReviewsWidget.tsx`
- `uiux/jigi-app/src/components/dashboard/RecentCampaignsWidget.tsx`
- `uiux/jigi-app/src/components/dashboard/GenerationMixCard.tsx`

---

## PRD03: UI List Pages

**PRD:** [prd03-ui-list-pages.md](prd03-ui-list-pages.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Campaigns Page | Done | Status filter, sort (Name/Date/Status), debounced search, card hover, loading skeleton, empty state | |
| Sprint 2: Brands Page | Done | Search when brands.length >= 5, colour swatches, status badges, consistent empty state | |
| Sprint 3: Approved Assets Page | Done | Type filter, sort (Date/Campaign/Type), card hover, EmptyState, grid/list toggle | |
| Sprint 4: Review Queue Page | Done | Filter + sort, card hover, asset type icons, Start Review primary, Recently Reviewed styled | |

### Implementation Summary

- **Campaigns:** useDebouncedValue(300ms); status filter (Select); sort (Name, Date updated, Status); Card shadow-card/hover; Skeleton matching grid; CampaignCard extracted
- **Brands:** Search when brands.length >= 5, debounced; colour swatches (primary, secondary, accent); statusStyles with Badge; BrandCard extracted; EmptyState standardized
- **Approved Assets:** Type filter (Concept, Copy, Image); sort (Date, Campaign, Type); EmptyState; grouped cards with shadow; list items bg-muted/50 hover
- **Review Queue:** Sort (Oldest first, Campaign name); sortedQueueItems; ReviewQueueCard shadow; Recently Reviewed with asset type icons; EmptyState "All caught up!"

### Files Changed

- `uiux/jigi-app/src/pages/Campaigns.tsx`
- `uiux/jigi-app/src/pages/Brands.tsx`
- `uiux/jigi-app/src/pages/ApprovedAssets.tsx`
- `uiux/jigi-app/src/pages/ReviewQueue.tsx`
- `uiux/jigi-app/src/components/approved/ApprovedAssetCard.tsx`

---

## PRD04: UI Detail & Form Pages

**PRD:** [prd04-ui-detail-forms.md](prd04-ui-detail-forms.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Campaign Detail | Done | Summary card, breadcrumb, GenerationPanel tab styling, asset card hover states, empty states (Concepts, Copy, Images), loading skeleton, Brief tab design tokens | |
| Sprint 2: Campaign Create | Done | Form sections (Basics, Brief, Channels), step indicator, validation focus on first invalid, space-y-6, prominent primary submit | |
| Sprint 3: Brand Profile | Done | Section cards with icons, larger colour swatches (h-24), tone chips with hover, save feedback (toast), hover states on cards and interactive elements | |

### Implementation Summary

- **CampaignDetail:** Breadcrumb, summary card (status, progress, last updated), design tokens throughout; Brief tab labels/values use text-foreground, text-muted-foreground; visual preview cards hover:border-primary
- **GenerationPanel:** Tab selector with clearer active state (bg-background, border); empty states for Concepts, Copy, Images; design tokens (border-border, bg-muted, text-foreground); sidebar styling
- **ConceptCard, CopyCard, ImageCard:** Design tokens, hover:border-primary/60, status draft → bg-muted
- **CampaignCreate:** Step 1 of 3 indicator; Basics section header; form grouping; handleSubmit with focusFirstInvalid on validation error; journey mode cards use border-primary; primary submit size-lg
- **BrandProfile:** Cards with transition-shadow hover:shadow-md; colour swatches h-24 w-24 with group-hover:scale-105; tone Badges with hover:bg-primary/20; Save/Cancel/Edit/Back hover states; agency access rows hover:bg-muted/50

### Files Changed

- `uiux/jigi-app/src/pages/CampaignDetail.tsx`
- `uiux/jigi-app/src/pages/CampaignCreate.tsx`
- `uiux/jigi-app/src/pages/BrandProfile.tsx`
- `uiux/jigi-app/src/components/generation/GenerationPanel.tsx`
- `uiux/jigi-app/src/components/generation/ConceptCard.tsx`
- `uiux/jigi-app/src/components/generation/CopyCard.tsx`
- `uiux/jigi-app/src/components/generation/ImageCard.tsx`

---

## PRD05: UI Asset Review & Modals

**PRD:** [prd05-ui-review-modals.md](prd05-ui-review-modals.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Asset Review Layout & Actions | Done | Breadcrumb (Review Queue > Campaign > Asset), responsive layout, loading skeleton, action hierarchy (Approve primary, Reject destructive, Request changes outline), design tokens, hover states | |
| Sprint 2: Modal Standardization | Done | DialogClose for custom close, rounded-xl shadow-xl, design tokens, Escape/backdrop (Radix default), AssetDetailModal responsive layout | |
| Sprint 3: Prev/Next Navigation & Keyboard | Done | Prev/next with ChevronLeft/Right on mobile, ArrowLeft/ArrowRight keyboard shortcuts, aria-labels on nav buttons | |

### Implementation Summary

- **AssetReview:** Breadcrumb nav; loading skeleton; flex-col lg:flex-row for responsive; prev/next strip horizontal on mobile; keyboard ArrowLeft/ArrowRight; design tokens
- **ReviewActions:** Approve (green primary), Request changes (outline), Reject (destructive); transition-colors
- **AssetDetailsSidebar:** Responsive w-full lg:w-96; bg-muted/30; design tokens; hover states on buttons
- **AssetPreviewArea:** Design tokens (bg-muted, text-foreground, border-border)
- **Modals (AssetDetailModal, ImagePreviewModal, ConceptDetailModal, CopyDetailModal):** showCloseButton={false}, DialogClose asChild for custom close, rounded-xl border-border shadow-xl, design tokens, aria-label on close
- **ApproveModal, RejectModal, RequestChangesModal:** Hover states on Cancel/Confirm

### Files Changed

- `uiux/jigi-app/src/pages/AssetReview.tsx`
- `uiux/jigi-app/src/components/review/AssetPreviewArea.tsx`
- `uiux/jigi-app/src/components/review/AssetDetailsSidebar.tsx`
- `uiux/jigi-app/src/components/review/ReviewActions.tsx`
- `uiux/jigi-app/src/components/review/ApproveModal.tsx`
- `uiux/jigi-app/src/components/review/RejectModal.tsx`
- `uiux/jigi-app/src/components/review/RequestChangesModal.tsx`
- `uiux/jigi-app/src/components/approved/AssetDetailModal.tsx`
- `uiux/jigi-app/src/components/generation/ImagePreviewModal.tsx`
- `uiux/jigi-app/src/components/generation/ConceptDetailModal.tsx`
- `uiux/jigi-app/src/components/generation/CopyDetailModal.tsx`

---

## PRD06: UI Auth & Setup Screens

**PRD:** [prd06-ui-auth-setup.md](prd06-ui-auth-setup.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Auth Screens | Done | AuthLayout gradient background, larger logo, link hover states, loading states, design tokens | |
| Sprint 2: Setup Screens | Done | Organisation Step 1 of 2, Journey Step 2 of 2, rounded-xl cards, hover:bg-muted/30 | |
| Sprint 3: Quick Start & Onboarding | Done | Quick Start step indicators (1,2,3), Onboarding step circles, design tokens, hover states | |

### Implementation Summary

- **AuthLayout:** Radial gradient overlay (primary/8 at top), logo h-12 w-12 shadow-lg, link hover transition
- **Login, Signup, ResetPassword, ResetPasswordConfirm:** Link hover:text-primary/90, Button transition-colors, Back to sign in hover:bg-muted
- **OrganisationSetup:** Step 1 of 2 indicator, option cards rounded-xl hover:bg-muted/30
- **JourneyChoice:** Step 2 of 2 indicator, option cards rounded-xl p-6 hover:bg-muted/30
- **QuickStart:** Step circles (1,2,3), bg-primary/10 icon, design tokens, Button transitions
- **Onboarding:** Step cards hover:bg-muted/30, design tokens (bg-muted, text-primary)
- **OnboardingWizard:** Step circles for all 6 steps, Back/Skip/Continue hover states

### Files Changed

- `uiux/jigi-app/src/components/auth/AuthLayout.tsx`
- `uiux/jigi-app/src/pages/auth/Login.tsx`
- `uiux/jigi-app/src/pages/auth/Signup.tsx`
- `uiux/jigi-app/src/pages/auth/ResetPassword.tsx`
- `uiux/jigi-app/src/pages/auth/ResetPasswordConfirm.tsx`
- `uiux/jigi-app/src/pages/setup/OrganisationSetup.tsx`
- `uiux/jigi-app/src/pages/setup/JourneyChoice.tsx`
- `uiux/jigi-app/src/pages/QuickStart.tsx`
- `uiux/jigi-app/src/pages/Onboarding.tsx`
- `uiux/jigi-app/src/components/onboarding/OnboardingWizard.tsx`

---

## PRD07: UI Settings

**PRD:** [prd07-ui-settings.md](prd07-ui-settings.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Tabs & Profile Section | Done | TabsList/TabsTrigger clearer active state and hover; Profile card grid, avatar placeholder, Save loading/success toast; Appearance card label/description, switch | |
| Sprint 2: Notifications, Team, API Tabs | Done | Consistent card layout; section icons (Bell, Users, Key); hover states on rows; styled empty states for Team and API | |

### Implementation Summary

- **tabs.tsx:** TabsList h-10, gap; TabsTrigger clearer active (bg-background, shadow, border), hover (text-foreground, bg-background/50), focus-visible ring
- **Settings.tsx:** Profile: avatar upload placeholder (Camera icon, dashed circle), grid for name fields, Save button with loading state and toast.success; Appearance: Label + description, Switch with aria-labelledby, row hover:bg-muted/50
- **Settings.tsx:** Notifications: each switch row with rounded-lg p-3 hover:bg-muted/50; Team/API: styled empty states (dashed border, icon, "Coming soon" title, description); Security row hover; design tokens (no hardcoded teal)

### Files Changed

- `uiux/jigi-app/src/components/ui/tabs.tsx`
- `uiux/jigi-app/src/pages/Settings.tsx`

---

## PRD08: UI Landing Page

**PRD:** [prd08-ui-landing.md](prd08-ui-landing.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Navbar Sticky & Mobile | Done | Sticky + scroll effect (blur, shadow); mobile hamburger; overlay on open; 44px touch targets on mobile links/buttons | |
| Sprint 2: Section Animations & CTAs | Done | useInView scroll animations; CTA active:scale-[0.98]; transition-colors; primary vs secondary hierarchy | |
| Sprint 3: Mobile Polish & Micro-interactions | Done | Feature/testimonial/ROI card hover; design tokens (PainToOutcome, ROISection); footer touch targets; px-4 sm:px-6 for small viewports | |

### Implementation Summary

- **Navbar:** Overlay (backdrop-blur) on mobile menu open; min-h-11 / size-11 touch targets; aria-expanded on toggle
- **Landing:** AnimateSection wrapper with useInView; fade-in + slide-up on scroll; motion-reduce support
- **CTAs:** active:scale-[0.98] on Hero, FinalCTA, Navbar buttons
- **Cards:** transition-all duration-200, hover:shadow-md, hover:border-primary/20 on FeatureGrid, Testimonials, DualJourney, PainToOutcome, ROISection
- **Design tokens:** PainToOutcome/ROISection use destructive/primary instead of red/emerald
- **Footer:** min-h-[44px] on mobile links; responsive grid gap

### Files Changed

- `uiux/jigi-app/src/components/landing/navbar.tsx`
- `uiux/jigi-app/src/components/landing/hero.tsx`
- `uiux/jigi-app/src/components/landing/final-cta.tsx`
- `uiux/jigi-app/src/components/landing/pain-to-outcome.tsx`
- `uiux/jigi-app/src/components/landing/how-it-works.tsx`
- `uiux/jigi-app/src/components/landing/feature-grid.tsx`
- `uiux/jigi-app/src/components/landing/dual-journey.tsx`
- `uiux/jigi-app/src/components/landing/testimonials.tsx`
- `uiux/jigi-app/src/components/landing/roi-section.tsx`
- `uiux/jigi-app/src/components/landing/footer.tsx`
- `uiux/jigi-app/src/pages/Landing.tsx`
- `uiux/jigi-app/src/hooks/useInView.ts` (new)

---

## PRD09: UI Design Token Cleanup

**PRD:** [prd09-ui-design-tokens.md](prd09-ui-design-tokens.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Audit & Shell Replacement | Done | Added --color-success, --color-warning, --color-error to theme; lib/status, campaignStore, StatusBadge; Shell (Sidebar, Header); Dashboard (QuickStatsWidget, PendingReviewsWidget, StatCard) | |
| Sprint 2: List Pages Replacements | Done | Campaigns, Brands, Approved Assets, Review Queue; gray-* → muted; status badges → semantic | |
| Sprint 3: Detail Pages & Remaining | Done | Campaign Detail/Create, Brand Profile; Asset Review, modals; Auth, Landing; AssetCard, CopyCard, ImageCard, ConceptCard; Upload, ComplianceDisplay, GenerationPanel, etc. | |
| Sprint 4: Documentation & Dark Mode | Done | docs/DESIGN-TOKENS.md; token reference; dark mode via .dark class | |

### Implementation Summary

- **globals.css:** Added --color-success, --color-warning, --color-error to @theme
- **lib/status.ts:** STATUS_CONFIG and REVIEW_ACTIONS use semantic tokens (muted, primary, warning, success, destructive)
- **campaignStore, StatusBadge:** Campaign/asset status options use tokens
- **All components:** Replaced gray-*, teal-*, red-*, green-*, orange-*, blue-*, amber-* with semantic tokens
- **docs/DESIGN-TOKENS.md:** Token reference with usage guidelines

### Files Changed

- `uiux/jigi-app/src/styles/globals.css`
- `uiux/jigi-app/src/lib/status.ts`
- `uiux/jigi-app/src/store/campaignStore.ts`
- `uiux/jigi-app/src/components/ui/StatusBadge.tsx`
- 50+ component files (generation, review, dashboard, layout, pages, etc.)
- `docs/DESIGN-TOKENS.md` (new)

---

## PRD10: UI Polish & Accessibility

**PRD:** [prd10-ui-polish-accessibility.md](prd10-ui-polish-accessibility.md)

### Sprint Status

| Sprint | Status | Completed Items | Notes |
|--------|--------|-----------------|-------|
| Sprint 1: Transitions & Hover States | Done | transition-colors/shadow on Button, Card, Input, Sidebar; .transition-interactive, .transition-shadow-interactive utilities; motion-reduce:transition-none | |
| Sprint 2: Focus States & Keyboard Navigation | Done | focus-visible:ring-2 on Button, Input, Header CTAs, Sidebar nav; aria-label on icon-only buttons (back, edit, clear selection, password visibility); aria-current on active nav; Radix Escape/Enter/Space | |
| Sprint 3: Mobile QA & Breakpoints | Done | min-w-0 overflow-x-hidden on body, AppLayout, main; touch targets min-h-[44px] on Header hamburger; sidebar drawer on mobile | |
| Sprint 4: Reduced Motion & Final Pass | Done | motion-reduce on Dialog, Sheet, DropdownMenu, Popover, Select; skeleton/spinner animate-none; scroll-behavior: auto when reduced | |

### Implementation Summary

- **globals.css:** .focus-ring, .transition-interactive, .transition-shadow-interactive; prefers-reduced-motion disables smooth scroll; skeleton motion-reduce:animate-none
- **Button, Input, Card:** transition-colors/shadow duration-200; focus-visible ring; motion-reduce:transition-none
- **Header:** focus-visible on hamburger, CTAs, user menu, search; aria-label on menu button
- **Sidebar:** transition-colors on nav links; focus-visible ring; aria-current="page" on active nav
- **Icon-only buttons:** aria-label on CampaignCreate back, BrandProfile back/edit, AssetGrid clear, Login/Signup/ResetPasswordConfirm password visibility
- **Layout:** body/main min-w-0 overflow-x-hidden; main overflow-x-hidden overflow-y-auto
- **Modals/Overlays:** Dialog, Sheet, DropdownMenu, Popover, Select content/overlay motion-reduce:animate-none motion-reduce:duration-0
- **Skeleton, Spinner:** motion-reduce:animate-none

### Files Changed

- `uiux/jigi-app/src/styles/globals.css`
- `uiux/jigi-app/src/components/ui/button.tsx`
- `uiux/jigi-app/src/components/ui/card.tsx`
- `uiux/jigi-app/src/components/ui/input.tsx`
- `uiux/jigi-app/src/components/ui/dialog.tsx`
- `uiux/jigi-app/src/components/ui/sheet.tsx`
- `uiux/jigi-app/src/components/ui/dropdown-menu.tsx`
- `uiux/jigi-app/src/components/ui/popover.tsx`
- `uiux/jigi-app/src/components/ui/select.tsx`
- `uiux/jigi-app/src/components/ui/skeleton.tsx`
- `uiux/jigi-app/src/components/ui/spinner.tsx`
- `uiux/jigi-app/src/components/layout/AppLayout.tsx`
- `uiux/jigi-app/src/components/layout/Header.tsx`
- `uiux/jigi-app/src/components/layout/Sidebar.tsx`
- `uiux/jigi-app/src/pages/CampaignCreate.tsx`
- `uiux/jigi-app/src/pages/BrandProfile.tsx`
- `uiux/jigi-app/src/pages/auth/Login.tsx`
- `uiux/jigi-app/src/pages/auth/Signup.tsx`
- `uiux/jigi-app/src/pages/auth/ResetPasswordConfirm.tsx`
- `uiux/jigi-app/src/components/generation/AssetGrid.tsx`
