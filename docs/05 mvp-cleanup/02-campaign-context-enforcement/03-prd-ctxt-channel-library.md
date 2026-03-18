# PRD 03 — Channel Constraints Library

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Implement the Channel Constraints Library — a built-in catalog of channel specifications (image dimensions, copy limits, format rules) that the Brief Compiler uses when assembling the CCO. Each selected channel in the brief maps to a format_constraints object. Users do not enter these manually; they are auto-applied from the library.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Library coverage | At least 10 channels with full specs |
| Schema consistency | Each channel has image_dimensions, copy_limits, format_rules, content_type |
| Lookup by channel_id | Compiler can fetch constraints for selected channels |
| Extensibility | New channels can be added without code changes (config-driven) |

---

## User Stories

### As the Brief Compiler
- I need to look up constraints for each selected channel
- I need image_dimensions (width, height, aspect_ratio, safe_zones)
- I need copy_limits (max_chars, headline_max, cta_max per deliverable type)
- I need format_rules as a list of channel-specific rules

### As a user
- I select channels in the brief; I don't need to enter dimensions or limits
- Generated assets automatically respect channel specs

---

## Sprints

### Sprint 1: Channel Schema & Data Model
**Duration:** 1–2 days

- Define channel_constraints schema: channel_id, image_dimensions, copy_limits, format_rules, content_type
- Define image_dimensions: width, height, aspect_ratio, safe_zones
- Define copy_limits: max_chars, max_lines, headline_max, cta_max, caption_max, etc.
- Create TypeScript types

**Deliverables:**
- [ ] Channel constraints schema
- [ ] TypeScript types

---

### Sprint 2: Core Channel Definitions (Social)
**Duration:** 2 days

- Add Instagram Story: 1080×1920, 125 chars overlay, text in top 40%, 14% bottom for swipe-up
- Add Instagram Post: 1080×1080, 2,200 chars caption, first 125 visible, 30 hashtags max
- Add Instagram Reel: 1080×1920, 2,200 chars caption, no links in caption, centre 80% safe zone
- Add Facebook Post: 1200×630, 63,206 chars (500 optimal), first 3 lines visible
- Add Facebook Ad: 1080×1080 or 1200×628, 125 primary / 40 headline / 25 description, text <20% image

**Deliverables:**
- [ ] 5 social channel definitions

---

### Sprint 3: Additional Channel Definitions
**Duration:** 2 days

- Add Twitter/X Post: 1600×900, 280 chars, 16:9 crop
- Add LinkedIn Post: 1200×1200, 3,000 chars, first 2 lines visible
- Add Display Ad: IAB sizes (300×250, 728×90, 160×600), 90 body / 25 CTA
- Add Website Banner: 1440×400, 50 headline / 120 body
- Add Email Header: 600×200, subject 50 / pre-header 100

**Deliverables:**
- [ ] 5 additional channel definitions

---

### Sprint 4: Library Service & Storage
**Duration:** 1–2 days

- Store channel library in DB (channel_constraints table) or config (JSON/TS)
- Create lookup service: getChannelConstraints(channelIds: string[])
- Return array of constraint objects for CCO.channel_constraints
- Ensure channel_ids in library match brief channel selection options

**Deliverables:**
- [ ] Channel library storage
- [ ] Lookup service
- [ ] Integration with Brief Compiler (or stub for next PRD)

---

## Acceptance Criteria

- [ ] At least 10 channels with full specs
- [ ] Each channel has image_dimensions, copy_limits, format_rules, content_type
- [ ] Lookup by channel_id returns correct constraints
- [ ] Library is config-driven or easily extensible

---

## Dependencies

- Brief channel selection options (existing)
- PRD 01 (CCO schema) for channel_constraints structure
