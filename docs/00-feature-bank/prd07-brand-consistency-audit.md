# PRD 07 — Brand Consistency Pre-Review Audit

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

An **agentic** module that audits generated assets (images, copy) against stored brand guidelines (colors, voice, tone) and flags mismatches **before** they reach human review. Reduces back-and-forth and keeps approvals aligned with brand.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Catch off-brand assets early | Assets flagged before submission to brand |
| Reduce revision cycles | Fewer "changes requested" due to brand drift |
| Brand alignment | Clear audit trail of compliance checks |

---

## User Stories

### As an agency creative
- I want to know if my generated asset is off-brand before I submit it
- I want to fix issues before the brand sees them

### As a brand
- I want assets to be pre-checked against my guidelines
- I want fewer surprises in review

---

## Functional Requirements

### 1. Brand guidelines (input)

- **Colors:** Primary, secondary, accent from brand identity
- **Voice/tone:** From brand profile (e.g. preferred_words, avoided_words, tone)
- **Format:** Stored in `brands.identity` or equivalent

### 2. Audit checks

- **Images:** Color extraction (e.g. dominant colors) vs brand palette; flag if off
- **Copy:** Tone/voice check (e.g. LLM or keyword scan) vs brand voice
- **Output:** Pass / Fail / Warning per check; optional overall score

### 3. Storage

- **Audit result:** `asset_brand_audit` table: `asset_id`, `check_type`, `result`, `details`, `created_at`
- **Asset metadata:** Optional `brand_audit_score` or `brand_audit_flags` on asset

### 4. UI

- **Asset card/detail:** Badge or icon if audit failed (e.g. "Off-brand colors")
- **Audit details:** Expandable section showing which checks failed and why
- **Pre-submit:** Optional "Run audit" before submit; block or warn if failed

### 5. Agentic behaviour

- **Trigger:** On asset create/update (for AI assets) or on upload (for uploaded assets)
- **Logic:** Fetch brand guidelines → run checks (color extraction, tone analysis) → store results
- **Modular:** Can be an API or Base44 agent

---

## Technical Considerations

- **Color extraction:** Use colorthief or similar; compare to brand hex values
- **Tone:** LLM prompt or keyword-based; compare to brand voice
- **Performance:** Async audit; don't block asset creation

---

## Acceptance Criteria

- [ ] Images are audited for color alignment with brand palette
- [ ] Copy is audited for tone/voice alignment with brand
- [ ] Audit results are stored and visible in the UI
- [ ] User can see which checks failed and why
- [ ] Optional: block or warn on submit if audit failed

---

## Out of Scope (v1)

- Full compliance (legal, trademark)
- Automatic regeneration on failure
- Custom audit rules per brand

---

## Dependencies

- `brands.identity` (colors, voice)
- `creative_assets` (content, type)
- Color extraction or LLM for tone analysis
