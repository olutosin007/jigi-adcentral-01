# PRD 10 — Drift Detection & Asset Lineage

**Status:** Draft  
**Version:** 1.0  
**Parent:** [Jigi_Campaign_Context_Object_Spec_v1.docx.md](./Jigi_Campaign_Context_Object_Spec_v1.docx.md)

---

## Overview

Implement Drift Detection and Asset Lineage. When a user edits the Campaign Brief, the CCO is recompiled and its version increments. Jigi must determine which existing assets are potentially out of alignment with the new brief. All assets store lineage metadata (cco_version, bio_version, generation_timestamp, validation_scores). High-impact brief changes flag all assets as "Review Required"; low-impact changes flag only affected tracks. Users can trigger batch re-validation.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| CCO diff on save | New CCO diffed against previous version |
| Impact classification | High-impact: key_message, target_audience, channels, tone_override; Low-impact: additional_requirements, reference_assets |
| Drift flagging | Assets from previous CCO version flagged with drift indicator |
| High-impact | All assets "Review Required" |
| Low-impact | Only assets in affected tracks flagged |
| Asset lineage | cco_version, bio_version, generation_timestamp, validation_scores on every asset |
| Batch re-validation | User can trigger re-validation against new CCO |

---

## User Stories

### As a user
- I want to know when my brief changes make existing assets potentially outdated
- I want to see which assets need review
- I want to re-validate assets in batch to update scores
- I want to see which brief version produced each asset

### As the system
- I need to diff CCO on brief save
- I need to classify change impact
- I need to flag assets by CCO version
- I need to support batch re-validation

---

## Sprints

### Sprint 1: Asset Lineage Schema & Storage
**Duration:** 1–2 days

- Ensure every concept, copy, image stores: cco_version, bio_version, generation_timestamp, validation_scores (JSONB snapshot)
- Add columns if not present (from PRD 01)
- Populate on generation/import
- Expose lineage in asset API/UI

**Deliverables:**
- [ ] Lineage columns on concepts, copy, images
- [ ] Populated on create
- [ ] API/UI exposure

---

### Sprint 2: CCO Diff on Brief Save
**Duration:** 2 days

- On brief save, after CCO compile: fetch previous CCO version
- Diff new CCO vs previous (field-by-field)
- Classify changed fields: high-impact (key_message, target_audience, channels, tone_override) vs low-impact (additional_requirements, reference_assets, exclusions)
- Persist diff result for drift logic

**Deliverables:**
- [ ] CCO diff
- [ ] Impact classification
- [ ] Diff result stored or passed downstream

---

### Sprint 3: Drift Flagging Logic
**Duration:** 2 days

- Query all assets for campaign where cco_version < new CCO version
- If high-impact change: flag all assets as "Review Required"
- If low-impact: flag only assets in affected tracks (e.g. exclusions change → flag copy and image; reference_assets → flag concept and image)
- Store drift indicator on asset (e.g. drift_status: 'review_required' | 'none')
- Update asset records

**Deliverables:**
- [ ] Drift flagging logic
- [ ] High/low impact handling
- [ ] drift_status on assets

---

### Sprint 4: Drift UI Indicators
**Duration:** 1–2 days

- Show drift indicator on "Generated" and "All Assets" tabs
- Badge or icon for "Review Required"
- Tooltip or modal explaining why (e.g. "Brief updated: key message changed")
- Filter: "Show only assets needing review"

**Deliverables:**
- [ ] Drift badge/icon in UI
- [ ] Explanation
- [ ] Filter option

---

### Sprint 5: Batch Re-Validation
**Duration:** 2 days

- Add "Re-validate all" or "Re-validate selected" action for campaign assets
- Trigger Validation Pipeline for each asset with new CCO
- Update validation_scores, flags, drift_status
- Show progress and results
- Clear "Review Required" for assets that pass re-validation (or keep flag with updated scores)

**Deliverables:**
- [ ] Batch re-validation action
- [ ] Validation Pipeline integration
- [ ] Score update
- [ ] Progress/result UI

---

## Acceptance Criteria

- [ ] CCO diff on brief save; impact classified
- [ ] Assets from previous CCO version flagged
- [ ] High-impact → all assets "Review Required"
- [ ] Low-impact → affected tracks only
- [ ] Asset lineage (cco_version, bio_version, etc.) stored and visible
- [ ] Batch re-validation updates scores and surfaces misalignments

---

## Dependencies

- PRD 01 (CCO schema, asset lineage)
- PRD 04 (Brief Compiler — CCO version increment)
- PRD 09 (Validation Pipeline)
- Campaign detail / assets UI
