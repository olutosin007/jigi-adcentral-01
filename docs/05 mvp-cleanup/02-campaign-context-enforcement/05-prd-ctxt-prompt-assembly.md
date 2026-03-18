# PRD 05 — Prompt Assembly & BIO Integration

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Implement the Prompt Assembly Service — a dedicated service that reads the BIO, CCO, and track-specific template for each generation call, substitutes placeholders with live values, and produces the final system prompt. The service enforces token budget, logs prompt hashes for audit, and integrates with the three-layer injection architecture (BIO → CCO → Track Template).

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Three-layer assembly | BIO (base) + CCO (campaign) + Track Template (output schema) |
| Placeholder substitution | All {bio.*} and {cco.*} placeholders replaced |
| Token budget | Truncate reference_assets and format_rules if over limit; never truncate key_message or hard_constraints |
| Audit logging | Assembled prompt hash stored with generated asset |
| Track templates | Concept, Copy, Image templates defined and wired |

---

## User Stories

### As a generation service
- I need the assembled system prompt for each Concept, Copy, or Image generation call
- I need BIO + CCO + Track Template merged in correct order
- I need placeholders replaced with actual values

### As an auditor
- I need to know which prompt produced each asset (prompt hash)

---

## Sprints

### Sprint 1: Prompt Assembly Service Core
**Duration:** 2 days

- Create Prompt Assembly Service
- Input: campaign_id, track (concept | copy | image), optional channel_id (for copy/image)
- Fetch BIO by brand_id (from campaign)
- Fetch CCO by campaign_id (latest version)
- Define placeholder syntax: {bio.field}, {cco.field}, {cco.channel_constraints[channel].field}

**Deliverables:**
- [ ] Assembly service
- [ ] BIO + CCO fetch
- [ ] Placeholder syntax defined

---

### Sprint 2: Placeholder Substitution Engine
**Duration:** 2 days

- Implement substitution for bio.* (voice_descriptors, value_propositions, messaging_architecture, approved_vocabulary, banned_phrases, visual_identity.*)
- Implement substitution for cco.* (strategic_context.*, audience_context.*, tone_profile.*, hard_constraints.*)
- Implement substitution for cco.channel_constraints[channel] (channel-specific)
- Handle missing values (empty string or sensible default)

**Deliverables:**
- [ ] Substitution for all BIO fields
- [ ] Substitution for all CCO fields
- [ ] Channel-specific substitution

---

### Sprint 3: Track Templates (Concept, Copy, Image)
**Duration:** 2–3 days

- Define Concept system prompt template (from spec §4.2.2)
- Define Copy system prompt template (from spec §4.3.2)
- Define Image system prompt template (from spec §4.4.2)
- Store templates as strings with placeholders
- Wire each track to its template in assembly service

**Deliverables:**
- [ ] Concept template
- [ ] Copy template
- [ ] Image template
- [ ] Track routing in assembly

---

### Sprint 4: Token Budget & Truncation
**Duration:** 1–2 days

- Define max token limit for system prompt (e.g. 8K or model-specific)
- If assembled prompt exceeds limit: truncate reference_asset descriptions first, then format_rules
- Never truncate key_message, hard_constraints.parsed_requirements, hard_constraints.parsed_exclusions
- Log truncation events

**Deliverables:**
- [ ] Token counting (or char-based proxy)
- [ ] Truncation logic
- [ ] Truncation logging

---

### Sprint 5: Audit Logging & Integration
**Duration:** 1 day

- Compute hash of assembled prompt (e.g. SHA-256)
- Store prompt_hash alongside generated asset
- Expose assemblePrompt(campaignId, track, channelId?) → { prompt, hash }
- Integrate with generation services (Concept, Copy, Image)

**Deliverables:**
- [ ] Prompt hash
- [ ] Hash stored with asset
- [ ] Integration with generation calls

---

## Acceptance Criteria

- [ ] BIO + CCO + Track Template assembled in correct order
- [ ] All placeholders substituted
- [ ] Token budget enforced; key_message and hard_constraints never truncated
- [ ] Prompt hash logged with asset
- [ ] Concept, Copy, Image generation receive correct assembled prompts

---

## Dependencies

- PRD 01 (CCO schema)
- PRD 04 (Brief Compiler — CCO available)
- BIO schema and storage
- Generation services (Concept, Copy, Image)
