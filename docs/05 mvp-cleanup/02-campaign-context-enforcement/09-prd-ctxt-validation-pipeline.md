# PRD 09 — Validation Pipeline

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Implement the Validation Pipeline — a post-generation validation layer that runs as a separate model call (or rule-based check) receiving generated output and CCO/BIO, and returning compliance scores and checklists defined in each track's output schema. Validation is independent of generation, ensuring consistent scoring and flagging across generated and imported assets.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Separation | Validation runs independently of generation |
| Track-specific | Concept, Copy, Image each have validation logic |
| Scores & checklists | Returns compliance scores and checklists per schema |
| Rule-based where possible | Use rules for character count, dimensions; model for semantic checks |
| Reusable | Same pipeline for generated and imported assets |

---

## User Stories

### As the system
- I need to validate generated concepts, copy, and images after creation
- I need to validate imported assets the same way
- I need rule-based checks where deterministic (e.g. character count)
- I need model-based checks for semantic alignment (e.g. key_message_link)

### As a user
- I want to see validation scores and flags on every asset
- I want to know why something was flagged

---

## Sprints

### Sprint 1: Validation Pipeline Architecture
**Duration:** 2 days

- Create Validation Pipeline service
- Input: asset (concept | copy | image), CCO, BIO
- Output: validation result (scores, checklists, flags, warnings)
- Define validation result schema per track

**Deliverables:**
- [ ] Pipeline service
- [ ] Input/output contracts
- [ ] Result schema

---

### Sprint 2: Concept Validation Logic
**Duration:** 2 days

- key_message_link: semantic check that it references key_message (model or embedding similarity)
- format_suitability: rule-based check that at least one channel in campaign's selected channels
- strategic_insight: semantic check for psychographic_trait reference
- brand_alignment_score: model-based comparison to BIO value propositions
- Return brand_alignment_score, brand_alignment_rationale, flags

**Deliverables:**
- [ ] Concept validation rules
- [ ] brand_alignment scoring
- [ ] Flags for violations

---

### Sprint 3: Copy Validation Logic
**Duration:** 2 days

- character_count: rule-based vs channel copy_limits
- mandatory_inclusions_check: model or keyword check for parsed_requirements
- exclusions_check: model or keyword check for parsed_exclusions
- legal_disclaimers_appended: rule-based check
- brand-voice score for imported copy: model-based similarity to BIO voice
- Return scores, checklists, truncation suggestion if over limit

**Deliverables:**
- [ ] Copy validation rules
- [ ] Inclusions/exclusions checks
- [ ] Brand-voice score (imported)
- [ ] Truncation suggestion

---

### Sprint 4: Image Validation Logic
**Duration:** 2–3 days

- dimensions: rule-based match to channel image_dimensions
- colour_compliance: extract dominant colours; compare to BIO palette; compute bio_palette_match
- composition_check: vision model or heuristics for safe_zones_clear, logo_area, text_overlay_area
- exclusions_check: vision model for competitor colours, banned imagery
- Return colour_compliance, composition_check, exclusions_check, flags

**Deliverables:**
- [ ] Image validation rules
- [ ] Colour extraction and comparison
- [ ] Composition analysis
- [ ] exclusions_check

---

### Sprint 5: Integration & Batch Validation
**Duration:** 1–2 days

- Integrate pipeline with Concept, Copy, Image generation flows (post-generation)
- Integrate with import flows
- Support batch validation: validate multiple assets (e.g. for drift re-validation)
- Store validation results with asset

**Deliverables:**
- [ ] Post-gen integration
- [ ] Import integration
- [ ] Batch validation
- [ ] Result persistence

---

## Acceptance Criteria

- [ ] Validation runs independently of generation
- [ ] Concept, Copy, Image each have validation logic
- [ ] Rule-based where deterministic; model-based for semantic
- [ ] Same pipeline for generated and imported
- [ ] Results stored with asset

---

## Dependencies

- PRD 01 (CCO schema)
- BIO
- AI/LLM for semantic checks
- Vision model for image validation
