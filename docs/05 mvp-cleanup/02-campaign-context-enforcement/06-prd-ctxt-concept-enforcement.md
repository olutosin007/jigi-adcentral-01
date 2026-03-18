# PRD 06 — Concept Track Enforcement

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Wire the Campaign Context Object into Concept generation. Every concept must trace back to the campaign's key_message and at least one brand value proposition. The Concept track uses the assembled system prompt (BIO + CCO + Concept Template), returns structured output per the Concept Output Schema, and is validated against Concept Validation Rules. Imported concepts receive the same validation pass.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| CCO injection | Concept generation receives assembled prompt with CCO |
| Output schema | AI returns concept_name, strategic_insight, creative_territory, headline_direction, format_suitability, key_message_link, brand_alignment_score, brand_alignment_rationale |
| key_message traceability | key_message_link must reference key_message |
| brand_alignment_score | Score 0–100; below 60 triggers warning |
| Imported concepts | Same validation and scoring |

---

## User Stories

### As a user
- I want generated concepts to align with my campaign's key message
- I want to see brand alignment scores and rationale
- I want imported concepts validated the same way

### As the system
- I need every concept to serve the key message
- I need every concept to link to at least one brand value proposition
- I need format_suitability to include at least one selected channel

---

## Sprints

### Sprint 1: Concept Generation Wiring
**Duration:** 2 days

- Replace or augment existing concept generation with Prompt Assembly Service call
- Pass assembled system prompt (BIO + CCO + Concept Template) to AI
- Ensure Concept Template includes OUTPUT: Return JSON matching Concept Output Schema
- Parse AI response into structured concept object

**Deliverables:**
- [ ] Concept gen uses assembled prompt
- [ ] Response parsed to schema

---

### Sprint 2: Concept Output Schema Enforcement
**Duration:** 2 days

- Define Concept Output Schema: concept_name, strategic_insight, creative_territory, headline_direction, format_suitability, key_message_link, brand_alignment_score, brand_alignment_rationale
- Add response validation: missing required fields trigger regeneration or error
- Store all fields with generated concept

**Deliverables:**
- [ ] Schema enforced
- [ ] Regeneration on invalid response
- [ ] Full concept object persisted

---

### Sprint 3: Concept Validation Rules (Generated)
**Duration:** 2 days

- key_message_link must not be empty and must semantically reference key_message
- format_suitability must include at least one channel from campaign's selected channels
- strategic_insight must reference at least one psychographic_trait from audience_context
- brand_alignment_score below 60 → warning flag visible to user
- Implement validation as post-generation check (or inline in prompt)

**Deliverables:**
- [ ] key_message_link validation
- [ ] format_suitability validation
- [ ] strategic_insight validation
- [ ] brand_alignment_score warning

---

### Sprint 4: Brand Alignment Scoring
**Duration:** 2 days

- Implement brand_alignment_score generation: compare concept to BIO value propositions
- Use validation pass (separate model call or rule-based) to produce 0–100 score
- Generate brand_alignment_rationale explaining score and any tensions
- If AI generates score in response, run validation pass to verify or override

**Deliverables:**
- [ ] brand_alignment_score 0–100
- [ ] brand_alignment_rationale
- [ ] Validation pass integration

---

### Sprint 5: Imported Concept Validation
**Duration:** 1–2 days

- When user imports a concept (not AI-generated), run same validation pass
- Produce brand_alignment_score and brand_alignment_rationale
- Apply same validation rules (key_message_link, format_suitability, strategic_insight)
- Surface warnings/flags on imported concepts

**Deliverables:**
- [ ] Imported concept validation
- [ ] Same scoring and rules
- [ ] UI flags for imported concepts

---

## Acceptance Criteria

- [ ] Concept generation uses CCO-injected prompt
- [ ] Output conforms to Concept Output Schema
- [ ] key_message_link validates against key_message
- [ ] brand_alignment_score < 60 triggers warning
- [ ] Imported concepts validated and scored

---

## Dependencies

- PRD 05 (Prompt Assembly)
- BIO
- Concept generation service (existing)
- Validation pipeline (PRD 09) — or inline validation
