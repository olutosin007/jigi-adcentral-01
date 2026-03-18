# PRD 08 — Image Track Enforcement

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Wire the Campaign Context Object into Image generation. The CCO constrains dimensions, colour palette, composition, mood, and style — all derived from the brief and brand. The Image track uses the assembled system prompt, returns/generates images per the Image Output Schema, and is validated against Image Validation Rules. Uploaded images run through the same validation pipeline.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| CCO injection | Image generation receives assembled prompt with CCO |
| Channel dimensions | dimensions match channel_constraints.image_dimensions exactly |
| Brand colours | colour_compliance.bio_palette_match; below 40 triggers warning |
| Safe zones | composition_check.safe_zones_clear must be true; false blocks approval |
| Key message support | key_message_support statement required |
| Uploaded images | Same validation (colour, composition, mood, exclusions) |

---

## User Stories

### As a user
- I want generated images to match channel dimensions
- I want images to use brand colours
- I want safe zones clear for UI overlays
- I want uploaded images validated the same way

### As the system
- I need images to visually reinforce the key message
- I need images to avoid visual exclusions (competitor colours, banned imagery)
- I need reference_assets (positive/negative) applied to image prompting

---

## Sprints

### Sprint 1: Image Generation Wiring
**Duration:** 2 days

- Replace or augment existing image generation with Prompt Assembly Service call
- Pass assembled system prompt (BIO + CCO + Image Template) with channel_id
- Ensure Image Template includes channel dimensions, safe zones, brand colours, reference direction
- Pass positive and negative reference asset descriptions to image model

**Deliverables:**
- [ ] Image gen uses assembled prompt
- [ ] Channel passed to assembly
- [ ] Reference assets in prompt

---

### Sprint 2: Image Output Schema & Dimensions
**Duration:** 2 days

- Define Image Output Schema: image_id, channel, image_url, dimensions, colour_compliance, composition_check, mood_alignment, style_adherence, key_message_support, exclusions_check
- Ensure dimensions match channel_constraints.image_dimensions exactly
- Auto-flag dimension mismatches
- Store all fields with generated image

**Deliverables:**
- [ ] Schema enforced
- [ ] Dimension validation
- [ ] Full image metadata persisted

---

### Sprint 3: Colour Compliance & Composition
**Duration:** 2–3 days

- Extract dominant colours from generated/uploaded image
- Compare to BIO visual_identity.colours (primary, secondary)
- Compute colour_compliance.bio_palette_match (0–100)
- Below 40 → "off-brand colour" warning
- composition_check: safe_zones_clear, logo_area_available, text_overlay_area
- safe_zones_clear must be true; false blocks approval
- Use vision model or rule-based analysis for composition

**Deliverables:**
- [ ] Colour extraction
- [ ] bio_palette_match score
- [ ] composition_check
- [ ] Approval block on safe_zones_clear false

---

### Sprint 4: Mood, Style & Key Message Validation
**Duration:** 2 days

- mood_alignment: statement of how image reflects emotional_register and effective_tone
- style_adherence: how image follows BIO photography/illustration style
- key_message_support: how image visually reinforces key_message
- Validate these fields present (AI-generated or validation pass)
- exclusions_check: flag competitor colours, banned imagery, clichés

**Deliverables:**
- [ ] mood_alignment
- [ ] style_adherence
- [ ] key_message_support
- [ ] exclusions_check

---

### Sprint 5: Uploaded Image Validation
**Duration:** 2 days

- When user uploads image, run same validation pipeline
- Colour extraction, composition analysis, mood scoring
- Apply same rules: dimensions, colour_compliance, composition_check, exclusions_check
- Surface warnings and blocks in UI

**Deliverables:**
- [ ] Uploaded image validation
- [ ] Same pipeline as generated
- [ ] UI for validation results

---

## Acceptance Criteria

- [ ] Image generation uses CCO-injected prompt
- [ ] dimensions match channel exactly; mismatches flagged
- [ ] colour_compliance.bio_palette_match < 40 triggers warning
- [ ] safe_zones_clear false blocks approval
- [ ] Uploaded images validated equally

---

## Dependencies

- PRD 05 (Prompt Assembly)
- PRD 03 (Channel constraints for image_dimensions)
- BIO (visual_identity)
- Image generation service (existing)
- Vision model for colour/composition analysis
