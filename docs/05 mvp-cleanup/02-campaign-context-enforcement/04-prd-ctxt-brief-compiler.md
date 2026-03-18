# PRD 04 — Brief Compiler Service

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Implement the Brief Compiler — a server-side service triggered on Campaign Brief save that transforms raw brief inputs into the structured Campaign Context Object (CCO). The compiler parses objective, audience, requirements, exclusions; merges tone; looks up channel constraints; and classifies reference assets. The output is a persisted CCO with version metadata.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Trigger on save | Compiler runs when user saves Campaign Brief |
| Objective parsing | goal_type and emotional_register extracted from objective |
| Audience parsing | demographic_cues, psychographic_traits, language_register, cultural_context extracted |
| Tone merge | effective_tone = BIO base_tone + campaign tone_override |
| Channel lookup | channel_constraints populated from library for selected channels |
| Requirements/exclusions | Parsed into structured lists |
| Reference asset classification | Vision model classifies and describes uploaded assets |
| CCO persistence | Full CCO persisted with version increment |

---

## User Stories

### As the system
- I need to compile the brief into a CCO every time the user saves
- I need to parse free text into structured fields for downstream AI
- I need to merge BIO tone with campaign tone_override
- I need to classify reference assets (mood_board, competitor_example, etc.)

### As a user
- I save the brief; the system compiles it automatically
- I don't need to structure my inputs — the compiler does it

---

## Sprints

### Sprint 1: Compiler Orchestration & Trigger
**Duration:** 2 days

- Create Brief Compiler service entry point
- Trigger on Campaign Brief save (webhook, API call, or DB trigger)
- Fetch raw brief inputs: objective, target_audience, channels, key_message, tone_override, additional_requirements, exclusions, reference_assets
- Fetch BIO for brand_id (or stub if BIO not yet built)
- Assemble CCO root: campaign_id, brand_id, compiled_at, version (increment from previous)

**Deliverables:**
- [ ] Compiler service
- [ ] Save trigger
- [ ] CCO root assembly

---

### Sprint 2: Objective & Strategic Context Parsing
**Duration:** 2–3 days

- Parse objective text: extract goal_type (awareness | engagement | conversion | retention | launch | event)
- Extract emotional_register (e.g. [excitement, discovery, aspiration]) via classification model or rules
- Pass key_message verbatim
- Match value_prop_alignment to BIO value propositions (or skip if no BIO)
- Populate strategic_context object

**Deliverables:**
- [ ] goal_type classification
- [ ] emotional_register extraction
- [ ] strategic_context populated

---

### Sprint 3: Audience Context Parsing
**Duration:** 2–3 days

- Parse target_audience text via NLP or rules
- Extract demographic_cues (age range, location, profession signals)
- Extract psychographic_traits (e.g. aspirational, creative, price-sensitive)
- Infer language_register (formal | conversational | slang-friendly | technical)
- Extract cultural_context (localisation notes, sensitivities)
- Populate audience_context object

**Deliverables:**
- [ ] demographic_cues extraction
- [ ] psychographic_traits extraction
- [ ] language_register inference
- [ ] audience_context populated

---

### Sprint 4: Channel Constraints & Tone Merge
**Duration:** 2 days

- Look up channel_constraints from Channel Library for each selected channel
- Fetch BIO base_tone
- Merge with campaign tone_override → effective_tone
- Generate vocabulary_guidance from effective_tone (natural-language instruction)
- Populate channel_constraints and tone_profile

**Deliverables:**
- [ ] channel_constraints from library
- [ ] tone_profile merge
- [ ] vocabulary_guidance generation

---

### Sprint 5: Hard Constraints Parsing
**Duration:** 1–2 days

- Parse additional_requirements into parsed_requirements (structured list)
- Parse exclusions into parsed_exclusions (structured list)
- Pull legal_disclaimers from BIO if channel/industry requires
- Populate hard_constraints object

**Deliverables:**
- [ ] parsed_requirements
- [ ] parsed_exclusions
- [ ] legal_disclaimers (from BIO)
- [ ] hard_constraints populated

---

### Sprint 6: Reference Asset Classification
**Duration:** 2–3 days

- For each uploaded reference asset: call vision model to classify (mood_board | competitor_example | previous_campaign | style_reference | negative_reference)
- Generate description of what the reference communicates visually/tonally
- Determine applicable_tracks (concept, copy, image)
- Populate reference_assets array in CCO

**Deliverables:**
- [ ] Asset classification
- [ ] Asset description generation
- [ ] reference_assets populated

---

### Sprint 7: Persistence & Versioning
**Duration:** 1–2 days

- Persist full CCO to DB (via PRD 01 schema)
- Increment version on every compile
- Handle first-time vs. edit scenarios (version 1 vs. version N+1)
- Return compiled CCO to caller

**Deliverables:**
- [ ] CCO persistence
- [ ] Version increment
- [ ] Compiler end-to-end flow

---

## Acceptance Criteria

- [ ] Compiler runs on brief save
- [ ] strategic_context, audience_context, channel_constraints, tone_profile, hard_constraints populated
- [ ] reference_assets classified and described (if any)
- [ ] CCO persisted with correct version
- [ ] Full CCO conforms to schema from PRD 01

---

## Dependencies

- PRD 01 (CCO schema)
- PRD 02 (Brief input fields)
- PRD 03 (Channel library)
- BIO (or stub)
- AI/LLM for classification (objective, audience, reference assets)
