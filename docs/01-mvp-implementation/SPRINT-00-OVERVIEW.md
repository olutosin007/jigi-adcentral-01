# Jigi MVP Implementation — Sprint Overview

**Version:** 1.0  
**Date:** February 27, 2026  
**Total Duration:** 10 Sprints (10 weeks)

---

## Sprint Structure

Each sprint is 1 week (5 working days). The MVP is structured into 4 phases across 10 sprints.

| Phase | Sprints | Focus |
|-------|---------|-------|
| **Phase 1: Foundation** | Sprint 1–3 | Project setup, auth, organisations, brand profiles |
| **Phase 2: Generation** | Sprint 4–6 | Campaigns, AI integration, creative generation |
| **Phase 3: Approval** | Sprint 7–9 | Review workflow, comments, notifications, nudging |
| **Phase 4: Polish & Launch** | Sprint 10 | Testing, bug fixes, documentation, pilot onboarding |

---

## Product Journeys (Built In From Start)

Jigi supports two first-class journeys:

1. **Brand-First Journey:** Team sets up brand profile first, then generates creative with strict brand grounding.
2. **Idea-First Journey (New):** Team starts with a text idea/campaign brief even with zero brand assets. Creative generation is available immediately, and brand elements are retro-fitted later.

### Idea-First Guardrails

- Idea-first must never block creative generation due to missing logo/colours/fonts.
- Brand onboarding remains available at any time as a progressive enhancement.
- Once brand data is added, future generations use enriched brand constraints automatically.
- Existing assets can be tagged as `idea_first` vs `brand_grounded` for reviewer clarity.

### Canonical Data Contract (Single Source of Truth)

All sprints must use the same field names and enum values below.

#### Core enums

| Enum | Values | Meaning |
|------|--------|---------|
| `journey_mode` | `brand_first`, `idea_first` | How campaign/user started |
| `brand_profile_status` | `starter`, `partial`, `complete` | Completeness of brand profile |
| `generation_mode` | `brand_grounded`, `idea_first` | Mode used for a generated asset/output |

#### Canonical fields by entity

| Entity | Fields | Notes |
|--------|--------|-------|
| `users` | `journey_mode` (nullable) | Optional preference captured at setup |
| `brands` | `journey_mode`, `brand_profile_status` | Replace any `setup_mode` usage |
| `campaigns` | `journey_mode`, `seed_idea` | `seed_idea` required for idea-first start |
| `creative_assets` | `generation_mode` | Set at creation time, immutable for that version |
| `generation_log` | `generation_mode` | Mirrors asset generation mode for analytics |
| `notifications` | `generation_mode` (nullable) | Used for clearer context in messages |

#### Contract rules

1. `journey_mode` describes **how work started**.
2. `generation_mode` describes **how a specific output was generated**.
3. A `campaign` may start as `idea_first`, then later produce `brand_grounded` assets after retrofit.
4. Never infer mode from missing fields; always persist explicit enum values.
5. API and UI labels must map directly to enum values (no alternate naming).

---

## Sprint Files

| File | Sprint | Key Deliverables |
|------|--------|------------------|
| `SPRINT-01-PROJECT-SETUP.md` | Week 1 | Repo, **UI component library**, **app layout/sidebar**, Supabase, Vercel |
| `SPRINT-02-AUTH-ORGANISATIONS.md` | Week 2 | Auth UI pages (login/signup), organisation creation UI, RLS |
| `SPRINT-03-BRAND-FOUNDATION.md` | Week 3 | Onboarding wizard UI (6 steps), brand profile pages, agency connections |
| `SPRINT-04-CAMPAIGNS-AI-SETUP.md` | Week 4 | Campaign list/detail UI, Azure OpenAI integration, AI orchestrator |
| `SPRINT-05-CREATIVE-GENERATION.md` | Week 5 | Generation panel UI, concept/copy cards, asset grid |
| `SPRINT-06-IMAGE-GENERATION-COMPLIANCE.md` | Week 6 | Image preview modal, compliance UI, generation polish |
| `SPRINT-07-SUBMISSION-WORKFLOW.md` | Week 7 | Review queue page, asset review page, status badges |
| `SPRINT-08-APPROVAL-NOTIFICATIONS.md` | Week 8 | Approval modals, comments sidebar, notification bell |
| `SPRINT-09-NUDGING-DASHBOARD.md` | Week 9 | Dashboard widgets, approved assets library, empty states |
| `SPRINT-10-POLISH-LAUNCH.md` | Week 10 | UI polish, responsive fixes, testing, pilot onboarding |

---

## UI Development Strategy

UI development is distributed across sprints with a **foundation-first approach**:

### Sprint 01: UI Component Library (Foundation)
All reusable components are built upfront:
- **Core Components:** Button, Input, Textarea, Select, Checkbox, Card, Badge, Avatar
- **Feedback Components:** Spinner, Skeleton, Toast, Modal, Tooltip
- **Layout Components:** AppLayout, Sidebar, Header, PageHeader, EmptyState, Dropdown

### Sprints 02-09: Feature-Specific UI
Each feature sprint builds its UI pages using the component library:

| Sprint | UI Pages/Features Built |
|--------|------------------------|
| Sprint 02 | Login, Signup, Password Reset, Org Creation pages |
| Sprint 03 | 6-step Onboarding Wizard, Brand List, Brand Profile pages |
| Sprint 04 | Campaign List, Campaign Create, Campaign Detail pages |
| Sprint 05 | Generation Panel, Concept Cards, Copy Cards, Asset Grid |
| Sprint 06 | Image Preview Modal, Compliance Display, Generation History |
| Sprint 07 | Review Queue page, Asset Review page (with preview area) |
| Sprint 08 | Approval Modals, Comments Sidebar, Notification Bell/Dropdown |
| Sprint 09 | Dashboard (widgets), Approved Assets Library |

### Journey Coverage Across Sprints

| Sprint | Brand-First Coverage | Idea-First Coverage |
|--------|----------------------|---------------------|
| Sprint 02 | Auth + org + route to onboarding | Auth + org + "Generate first" route |
| Sprint 03 | Full 6-step brand onboarding | Optional/deferred onboarding + starter brand defaults |
| Sprint 04 | Campaigns linked to brand profile | Campaigns can start from text idea without brand assets |
| Sprint 05 | Brand-grounded concept/copy generation | Fallback generation with idea seed + editable brand hints |
| Sprint 06 | Brand compliance checks | Baseline compliance checks when brand constraints are missing |
| Sprint 07-09 | Standard review/approval workflows | Same workflow with clear `idea_first` asset context |
| Sprint 10 | Polish and validate primary flow | Full regression for idea-first and retrofit flow |

### Sprint 10: UI Polish
Final pass on all UI:
- Responsive design fixes
- Loading/error state consistency
- Animation polish
- Accessibility audit

### UI Component Reference
All UI follows the design system in `JIGI_PROJECT_SPECIFICATION.md` Section 14:
- **Font:** Plus Jakarta Sans
- **Accent:** Teal (#0D9488)
- **Background:** Warm off-white (#FEFDFB)
- **Style:** "Polished whilst slightly muted"

---

## Success Criteria

By the end of Sprint 10:

- [ ] Agency can generate brand-grounded creative for connected brands
- [ ] Agency can generate useful creative from text-only idea when no brand assets exist
- [ ] Teams can retrofit brand assets later and improve subsequent generations
- [ ] Brands can review and approve/reject in the platform
- [ ] Time from submission to approval is measurably reduced
- [ ] At least one brand says "I'd pay for this"

---

## Technical Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | Vercel Serverless (TypeScript) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI (Text) | Azure OpenAI GPT-4o-mini |
| AI (Images) | Azure DALL-E 3 / Replicate Flux |
| Email | Resend |

---

## Recommended Templates & Libraries

The following templates and libraries accelerate development without adding bloat or complexity:

| Library | Sprint | Purpose | Size |
|---------|--------|---------|------|
| **shadcn/ui** | 01 | UI components (copied to project, not dependency) | 0KB runtime |
| **react-hook-form** | 03 | Multi-step form state management | ~8KB |
| **zod** | 03 | Type-safe schema validation | ~2KB |
| **colorthief** | 03 | Extract colors from logo images | ~3KB |
| **TanStack Query** | 05+ | Data fetching, caching, polling | ~12KB |
| **react-email** | 08 | Email templates as React components | 0KB runtime |

### Why These Choices

- **shadcn/ui**: Code is copied into your project, not imported as dependency. Full control, no lock-in, accessible by default.
- **react-hook-form**: Zero re-renders, works with shadcn forms, handles wizard state cleanly.
- **TanStack Query**: Handles caching, background refetch, and polling with minimal code.
- **react-email**: Same company as Resend, renders to HTML at build time.

### What We Avoid

| Avoided | Reason |
|---------|--------|
| Chakra/MUI/Ant Design | Bloat, harder to customize to Jigi design system |
| LangChain | Overkill for simple prompt templating |
| Redux/MobX | Zustand is simpler and already chosen |
| Next.js | Would change entire build process (Vite chosen) |
| Full charting libraries | No complex charts in MVP |

---

## Naming Convention

Sprint files follow this pattern:
```
SPRINT-{XX}-{SHORT-DESCRIPTION}.md
```

Where:
- `{XX}` is the zero-padded sprint number (01-10)
- `{SHORT-DESCRIPTION}` is a kebab-case description of the sprint focus

---

## How to Use These Documents

1. **Before each sprint:** Read the sprint file to understand scope and deliverables
2. **During development:** Use the task checklist to track progress
3. **End of sprint:** Review acceptance criteria before moving to next sprint
4. **Reference:** Link back to `JIGI_PROJECT_SPECIFICATION.md` for detailed specs

---

*Document Version: 1.0*  
*Last Updated: February 27, 2026*
