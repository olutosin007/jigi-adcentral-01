# PRD 02 — Campaign Brief Input Enhancement

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Add and wire new Campaign Brief input fields required for the CCO spec. Fields include key_message (required), tone_override (optional), reference_assets (optional uploads), and exclusions (optional). These strengthen downstream generation quality by giving the compiler and AI richer context.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| key_message field | Required field on brief; persisted and passed to compiler |
| tone_override field | Optional multi-select from brand-approved palette |
| reference_assets | File upload; stored and passed to compiler |
| exclusions field | Optional free text; persisted and parsed |

---

## User Stories

### As a campaign creator
- I want to specify the single key message this campaign must communicate
- I want to override brand tone for this campaign (e.g. playful, bold)
- I want to upload mood boards or reference images to guide creative
- I want to list things to avoid (competitors, clichés, banned phrases)

### As the system
- I need key_message to anchor every concept, copy, and image
- I need tone_override to merge with BIO for effective_tone
- I need reference_assets for image/concept track prompting
- I need exclusions for hard_constraints.parsed_exclusions

---

## Sprints

### Sprint 1: key_message Field
**Duration:** 1–2 days

- Add key_message field to Campaign Brief form (required)
- Add validation: non-empty, max length (e.g. 500 chars)
- Wire to campaign/brief data model
- Update brief save flow to include key_message

**Deliverables:**
- [ ] key_message input (textarea)
- [ ] Validation
- [ ] Persistence

---

### Sprint 2: tone_override Field
**Duration:** 2 days

- Define brand-approved tone palette (from BIO or config)
- Add tone_override multi-select to brief form
- Store as enum[] (e.g. [playful, bold])
- Merge logic deferred to Brief Compiler (this PRD only captures input)

**Deliverables:**
- [ ] tone_override multi-select UI
- [ ] Tone options from BIO or config
- [ ] Persistence

---

### Sprint 3: reference_assets Upload
**Duration:** 2–3 days

- Add reference_assets file upload to brief form
- Support images (and optionally PDFs)
- Store files in Supabase Storage (e.g. campaign_references bucket)
- Persist file URLs and metadata; classification deferred to Brief Compiler

**Deliverables:**
- [ ] File upload component
- [ ] Storage bucket + RLS
- [ ] File URLs persisted with campaign

---

### Sprint 4: exclusions Field
**Duration:** 1 day

- Add exclusions field to brief form (optional textarea)
- Validation: max length
- Wire to brief data model
- Parsing deferred to Brief Compiler

**Deliverables:**
- [ ] exclusions input
- [ ] Persistence

---

### Sprint 5: Form Layout & UX Polish
**Duration:** 1–2 days

- Integrate all new fields into Campaign Brief screen layout
- Add helper text / tooltips for key_message, tone_override, reference_assets, exclusions
- Ensure mobile responsiveness
- Add field-level error states

**Deliverables:**
- [ ] Integrated form layout
- [ ] Helper text
- [ ] Error states

---

## Acceptance Criteria

- [ ] key_message required and persisted
- [ ] tone_override optional, multi-select, persisted
- [ ] reference_assets upload works; files stored
- [ ] exclusions optional, persisted
- [ ] All fields wired to brief save

---

## Dependencies

- Campaign Brief screen (existing)
- BIO for tone palette (or config fallback)
- Supabase Storage
