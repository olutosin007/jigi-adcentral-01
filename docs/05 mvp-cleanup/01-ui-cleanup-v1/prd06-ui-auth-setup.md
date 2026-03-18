# PRD 06 — UI Auth & Setup Screens

**Status:** Draft  
**Version:** 1.0  
**Phase:** 6 of 10 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Create a cohesive, professional auth and onboarding experience. Auth screens (Login, Signup, Reset Password) and setup flows (Organisation Setup, Journey Choice, Quick Start, Onboarding) should feel polished and consistent.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Consistent AuthLayout | All auth screens share layout with branding |
| Clear form feedback | Focus states, validation errors, loading states |
| Setup flow clarity | Step indicators, progress feedback |
| Link hierarchy | "Forgot password", "Sign up" are clearly visible |

---

## User Stories

### As a user signing in
- I want a clean, focused form
- I want clear error messages when login fails
- I want easy access to "Forgot password" and "Sign up"

### As a user setting up
- I want to know where I am in the flow
- I want option cards (e.g. Journey Choice) to be visually distinct
- I want validation feedback when I submit

---

## Sprints

### Sprint 1: Auth Screens (Login, Signup, Reset Password)
**Duration:** 2–3 days

- Improve AuthLayout: ensure branding (logo) is prominent; add subtle background (gradient or pattern)
- Improve form focus states: ring on focus; consistent input styling
- Improve validation: inline errors; smooth transitions on error display
- Improve link styling: "Forgot password", "Sign up", "Back to login" with hover states
- Ensure loading state during submit (disabled button, spinner)
- Apply consistently to Login, Signup, Reset Password, Reset Password Confirm

**Deliverables:**
- [ ] AuthLayout improved
- [ ] Form focus and validation
- [ ] Link styling
- [ ] Loading states

---

### Sprint 2: Setup Screens (Organisation, Journey Choice)
**Duration:** 2 days

- Organisation Setup: add progress indicator (e.g. Step 1 of 2); improve step clarity
- Journey Choice: make option cards more distinct (icons, short descriptions, hover states)
- Ensure consistent card styling
- Add transitions on step change
- Improve CTA buttons

**Deliverables:**
- [ ] Progress indicator
- [ ] Journey Choice cards distinct
- [ ] Consistent styling

---

### Sprint 3: Quick Start & Onboarding
**Duration:** 2–3 days

- Quick Start: add visual progress (steps 1, 2, 3); improve step cards
- Onboarding: improve wizard step navigation; form field grouping
- Add optional tooltips for complex fields
- Ensure validation feedback is consistent
- Improve empty/placeholder states

**Deliverables:**
- [ ] Quick Start progress
- [ ] Onboarding wizard improved
- [ ] Tooltips where helpful
- [ ] Validation consistent

---

## Acceptance Criteria

- [ ] All auth screens use consistent AuthLayout
- [ ] Forms have focus states and validation feedback
- [ ] Setup flows have progress indicators
- [ ] Journey Choice cards are visually distinct
- [ ] Quick Start and Onboarding are polished

---

## Screens Affected

- Login (`/login`)
- Signup (`/signup`)
- Reset Password (`/reset-password`)
- Reset Password Confirm (`/reset-password-confirm`)
- Organisation Setup (`/setup/organisation`)
- Journey Choice (`/setup/journey`)
- Quick Start (`/app/quick-start`)
- Onboarding (`/app/onboarding`)

---

## Dependencies

- `AuthLayout` component
- Form components, validation schemas
- `OrganisationSetup`, `JourneyChoice`, `QuickStart`, `OnboardingWizard`
