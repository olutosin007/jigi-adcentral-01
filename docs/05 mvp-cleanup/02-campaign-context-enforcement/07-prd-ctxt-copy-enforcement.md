# PRD 07 — Copy Track Enforcement

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Wire the Campaign Context Object into Copy generation. Copy has the tightest guardrails: CCO governs vocabulary, length, tone, mandatory inclusions, and exclusions. Every copy variant is channel-specific. The Copy track uses the assembled system prompt, returns structured output per the Copy Output Schema, and is validated against Copy Validation Rules. Imported copy receives brand-voice similarity scoring; below 50 triggers "brand-tune" suggestion.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| CCO injection | Copy generation receives assembled prompt with CCO |
| Channel-specific | Each copy variant targets one channel; respects copy_limits |
| Output schema | copy_id, channel, deliverable_type, content, character_count, tone_adherence, key_message_delivery, mandatory_inclusions_check, exclusions_check, legal_disclaimers_appended |
| Character limits | character_count within channel_constraints; excess triggers truncation suggestion |
| Exclusions | exclusions_check.violated: true blocks approval |
| Imported copy | Brand-voice score; below 50 triggers brand-tune suggestion |

---

## User Stories

### As a user
- I want copy that stays within channel character limits
- I want copy that avoids banned phrases and exclusions
- I want mandatory inclusions checked
- I want imported copy scored for brand voice

### As the system
- I need copy to deliver the key message
- I need copy to use vocabulary_guidance and avoid banned phrases
- I need mandatory_inclusions_check and exclusions_check before return

---

## Sprints

### Sprint 1: Copy Generation Wiring
**Duration:** 2 days

- Replace or augment existing copy generation with Prompt Assembly Service call
- Pass assembled system prompt (BIO + CCO + Copy Template) with channel_id
- Ensure Copy Template includes channel-specific rules (max chars, format_rules)
- Parse AI response into structured copy object

**Deliverables:**
- [ ] Copy gen uses assembled prompt
- [ ] Channel passed to assembly
- [ ] Response parsed to schema

---

### Sprint 2: Copy Output Schema Enforcement
**Duration:** 2 days

- Define Copy Output Schema: copy_id, channel, deliverable_type, content, character_count, tone_adherence, key_message_delivery, mandatory_inclusions_check, exclusions_check, legal_disclaimers_appended
- Add response validation
- Store all fields with generated copy
- character_count auto-calculated from content

**Deliverables:**
- [ ] Schema enforced
- [ ] character_count calculated
- [ ] Full copy object persisted

---

### Sprint 3: Character Limit Validation
**Duration:** 1–2 days

- Fetch copy_limits for channel from CCO.channel_constraints
- Validate character_count against max_chars (or deliverable-specific limits)
- If exceeded: trigger truncation suggestion (not silent trim)
- Surface suggestion in UI

**Deliverables:**
- [ ] Character limit check
- [ ] Truncation suggestion
- [ ] UI for suggestion

---

### Sprint 4: Inclusions & Exclusions Validation
**Duration:** 2 days

- mandatory_inclusions_check: for each parsed_requirement applicable to copy, verify present: boolean
- exclusions_check: for each parsed_exclusion, verify violated: boolean
- Any exclusions_check.violated: true → block approval, flag in UI
- Any mandatory_inclusions_check.present: false → warning
- legal_disclaimers_appended: true if BIO requires disclaimers for channel/industry

**Deliverables:**
- [ ] mandatory_inclusions_check
- [ ] exclusions_check
- [ ] Block approval on violation
- [ ] legal_disclaimers check

---

### Sprint 5: Imported Copy Validation & Brand-Tune
**Duration:** 2 days

- When user imports copy, run validation pass
- Compute brand-voice similarity score (0–100) vs BIO voice_descriptors, approved_vocabulary, banned_phrases
- If score < 50: trigger "brand-tune" suggestion with specific rewrites
- Surface score and suggestion in UI

**Deliverables:**
- [ ] Imported copy validation
- [ ] Brand-voice score
- [ ] Brand-tune suggestion (score < 50)
- [ ] UI for score and suggestion

---

## Acceptance Criteria

- [ ] Copy generation uses CCO-injected prompt
- [ ] Output conforms to Copy Output Schema
- [ ] Character limits enforced; truncation suggested (not silent)
- [ ] Exclusions violation blocks approval
- [ ] Imported copy gets brand-voice score; < 50 triggers brand-tune

---

## Dependencies

- PRD 05 (Prompt Assembly)
- PRD 03 (Channel constraints for copy_limits)
- BIO
- Copy generation service (existing)
