# PRD 01 — CCO Schema & Data Model

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Define and implement the Campaign Context Object (CCO) schema and data model. The CCO is the structured payload compiled from the Campaign Brief at save-time, containing strategic context, audience context, channel constraints, tone profile, hard constraints, and reference assets. This PRD covers schema definition, database storage, and API contracts.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Schema completeness | All CCO sub-objects (strategic_context, audience_context, channel_constraints, tone_profile, hard_constraints, reference_assets) defined |
| Storage & retrieval | CCO persisted on brief save; retrievable by campaign_id |
| Versioning | CCO version increments on every brief edit |
| API contract | TypeScript types and API contracts for CCO read/write |

---

## User Stories

### As a developer
- I need a well-defined CCO schema so I can validate and persist compiled briefs
- I need CCO versioning so I can detect drift when the brief changes
- I need asset lineage fields (cco_version, bio_version) on generated assets

### As the system
- I need to store the CCO with campaign_id, brand_id, compiled_at, and version
- I need to support retrieval of the latest CCO for a campaign

---

## Sprints

### Sprint 1: Root CCO Schema Definition
**Duration:** 2–3 days

- Define root CCO object: campaign_id, brand_id, compiled_at, version
- Define strategic_context: objective_raw, goal_type, emotional_register, key_message, value_prop_alignment
- Define audience_context: audience_raw, demographic_cues, psychographic_traits, language_register, cultural_context
- Create TypeScript interfaces / Zod schemas for validation

**Deliverables:**
- [ ] Root CCO schema
- [ ] strategic_context schema
- [ ] audience_context schema
- [ ] TypeScript/Zod definitions

---

### Sprint 2: Channel, Tone & Hard Constraints Schemas
**Duration:** 2 days

- Define channel_constraints: channel_id, image_dimensions, copy_limits, format_rules, content_type
- Define tone_profile: base_tone, campaign_modifiers, effective_tone, vocabulary_guidance
- Define hard_constraints: requirements_raw, exclusions_raw, parsed_requirements, parsed_exclusions, legal_disclaimers
- Define reference_assets: asset_id, file_url, classification, applicable_tracks, description

**Deliverables:**
- [ ] channel_constraints schema
- [ ] tone_profile schema
- [ ] hard_constraints schema
- [ ] reference_assets schema

---

### Sprint 3: Database Storage & Migrations
**Duration:** 2–3 days

- Add `campaign_context` table or JSONB column on campaigns
- Store full CCO as JSONB with version, compiled_at
- Add indexes for campaign_id, brand_id
- Ensure RLS policies for campaign_context access

**Deliverables:**
- [ ] Migration for CCO storage
- [ ] RLS policies
- [ ] Indexes for lookup

---

### Sprint 4: API & Service Layer
**Duration:** 2 days

- Create service to persist CCO on brief save
- Create service to fetch CCO by campaign_id
- Expose API endpoints (or internal service calls) for CCO read/write
- Add asset lineage columns: cco_version, bio_version, generation_timestamp, validation_scores (JSONB)

**Deliverables:**
- [ ] CCO persist service
- [ ] CCO fetch service
- [ ] Asset lineage schema updates

---

## Acceptance Criteria

- [ ] Full CCO schema defined and validated
- [ ] CCO persisted on Campaign Brief save
- [ ] CCO retrievable by campaign_id
- [ ] Version increments on brief edit
- [ ] Asset lineage fields on concepts, copy, images

---

## Dependencies

- Campaign Brief screen (existing)
- Brand Intelligence Object (BIO) — referenced; may need to exist or be stubbed
- Supabase / Postgres
