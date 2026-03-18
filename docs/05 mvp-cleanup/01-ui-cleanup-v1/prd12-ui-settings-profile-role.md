# PRD 12 — Settings Profile: Role Display & Edit

**Status:** Draft  
**Version:** 1.0  
**Phase:** 12 (UI Cleanup v1)  
**Parent:** [UI-IMPROVEMENT-PHASES.md](../../UI-IMPROVEMENT-PHASES.md)

---

## Overview

Add explicit role display and editing to the Settings Profile tab. Currently, the user's role is shown only in the Sidebar (read-only) and is not visible or editable in Settings. This PRD wires the Profile form to real data and adds a Role field that users can view and change.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Role visible | User sees their role in Settings > Profile |
| Role editable | User can change their role via a Select dropdown |
| Real data | Profile form loads and saves name, role from `users` table |
| Clear feedback | Save shows loading state and toast on success/error |

---

## User Stories

### As a user viewing my profile
- I want to see my current role explicitly stated in Settings
- I want to understand what each role means (Admin, Approver, Reviewer, Agency Creator)

### As a user updating my profile
- I want to change my name and role when needed
- I want clear feedback when my changes are saved or fail

### As a team member
- I want my role in the sidebar to reflect any changes I make in Settings

---

## Current State

| Location | Role handling |
|----------|---------------|
| Sidebar | Read-only display via `getRoleLabel(profile?.role)` |
| Settings > Profile | No role field; form is mock (no data binding, no API) |
| authStore | `updateProfile(updates)` supports `Partial<UserProfile>` including `role` |
| users table | `role TEXT CHECK (role IN ('admin','approver','reviewer','creator'))` |
| RLS | "Users can update own profile" — users can update their own row |

---

## Feature Specifications

### Role options

| Value | Label | Description |
|-------|-------|-------------|
| admin | Admin | Full access to manage brand and team |
| approver | Approver | Can approve or reject creative assets |
| reviewer | Reviewer | Can view and comment on assets |
| creator | Agency Creator | Agency user; can generate and submit creatives |

### Permission model

- **MVP:** Users can change their own role (self-service).
- **Future:** Consider restricting (e.g. only admins can change role) or moving role changes to Team tab for admin-managed members.

---

## Sprints

### Sprint 1: Wire Profile Form to Real Data
**Duration:** 1–2 days

- Import `useAuthStore`; get `profile` and `updateProfile`
- Replace placeholder inputs with controlled inputs bound to `profile`:
  - Name: `profile?.name` (single field; users table has `name` and `full_name`)
  - Email: `profile?.email` (read-only; display only)
- Add loading state when `!profile` (e.g. skeleton or disabled form)
- Update `handleSaveProfile` to call `updateProfile({ name })` with form values
- Add toast on success (`Profile updated successfully`) and error
- Ensure "Save changes" shows loading state during save

**Deliverables:**
- [ ] Profile form bound to authStore profile
- [ ] Name and email displayed from profile
- [ ] Save persists name to users table
- [ ] Loading and toast feedback

---

### Sprint 2: Add Role Display & Edit
**Duration:** 1–2 days

- Add `USER_ROLES` constant (or extend existing) with all four roles: admin, approver, reviewer, creator
- Add Role field to Profile card:
  - Label: "Role"
  - Control: `Select` with options from `USER_ROLES`
  - Value: `profile?.role`
  - Include short description per role (e.g. tooltip or helper text)
- Include role in `handleSaveProfile`: `updateProfile({ name, role })`
- Ensure Sidebar reflects updated role after save (authStore already updates profile; sidebar reads from it)
- Add `aria-label` for accessibility

**Deliverables:**
- [ ] Role Select in Profile form
- [ ] Role persists to users table on save
- [ ] Sidebar updates when role changes
- [ ] Aria-labels

---

### Sprint 3: Polish & Edge Cases
**Duration:** 1 day

- Consider `updateProfile` using `.maybeSingle()` if RLS can block (similar to campaignStore pattern)
- Handle empty/missing profile gracefully (redirect or message)
- Ensure role options match DB constraint exactly
- Add brief role descriptions in Select (e.g. in SelectItem or helper text below)

**Deliverables:**
- [ ] Robust error handling for profile update
- [ ] Graceful empty-state handling
- [ ] Role descriptions visible

---

## Acceptance Criteria

- [ ] User sees their role in Settings > Profile
- [ ] User can change their role via Select dropdown
- [ ] Profile form loads real data (name, email, role)
- [ ] Save persists name and role to users table
- [ ] Sidebar shows updated role after save
- [ ] Toast feedback on success and error

---

## Screens Affected

- Settings (`/app/settings`) — Profile tab

---

## Dependencies

- `useAuthStore` — `profile`, `updateProfile`
- `users` table — `name`, `email`, `role` columns
- RLS: "Users can update own profile"
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `toast` from sonner

---

## Out of Scope (This Phase)

- Team tab role management (admin changing others' roles)
- Email change (requires auth flow)
- Role-based permission restrictions (e.g. only admins can edit role)
- Avatar upload
