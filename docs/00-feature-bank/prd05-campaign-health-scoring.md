# PRD 05 — Campaign Momentum & Health Scoring

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

An **agentic** module that periodically scores each campaign on **momentum** and **health** (e.g. % assets approved, days since last activity, completion %). Flags at-risk or stalled campaigns and suggests next actions (e.g. "Generate copy for Concept A", "Submit 2 drafts for review").

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Surface at-risk campaigns | Stalled or low-momentum campaigns are flagged |
| Actionable suggestions | Users receive specific next-step recommendations |
| Dashboard clarity | Campaign list or widget shows health/momentum at a glance |

---

## User Stories

### As a campaign owner
- I want to see which campaigns are stalled or at risk
- I want suggested next actions (e.g. "Generate copy for Concept A")
- I want to understand campaign completion at a glance

### As an agency creative
- I want to prioritise campaigns that need the most attention
- I want to know what to do next without digging through each campaign

---

## Functional Requirements

### 1. Scoring inputs

- **Completion %:** Approved assets / total assets (or target assets)
- **Days since activity:** `last_activity_at` or `updated_at`
- **Asset mix:** Concepts vs copy vs images; are key types present?
- **Review queue:** Assets stuck in review count

### 2. Health score

- **Formula (example):** Weighted combination of completion, recency, review backlog
- **Output:** Score 0–100 or tier (Healthy / At-risk / Stalled)
- **Stored:** Optional `campaign_health` table or computed on demand

### 3. Next-action suggestions

- **Logic:** "If no concepts → suggest Generate concepts"; "If concepts but no copy → suggest Generate copy"; "If drafts not submitted → suggest Submit for review"
- **Output:** Prioritised list of suggested actions per campaign

### 4. UI

- **Dashboard widget:** Campaign cards with health badge (e.g. green/yellow/red)
- **Campaign detail:** "Suggested next actions" section with actionable buttons
- **Campaign list:** Sort or filter by health (e.g. "Show at-risk first")

### 5. Agentic behaviour

- **Cron/scheduled:** Runs periodically (e.g. daily)
- **Logic:** Query campaigns → compute scores → suggest actions → optionally create notifications

---

## Technical Considerations

- **Real-time vs batch:** Score can be computed on demand for dashboard; batch for notifications
- **Caching:** Cache scores to avoid heavy queries

---

## Acceptance Criteria

- [ ] Campaign health score is computed (completion, recency, review backlog)
- [ ] At-risk and stalled campaigns are flagged in the UI
- [ ] Next-action suggestions are shown per campaign
- [ ] Suggestions are actionable (e.g. link to generate or submit)
- [ ] Optional: notification when campaign becomes at-risk

---

## Out of Scope (v1)

- Predictive analytics (e.g. "likely to miss deadline")
- Custom health rules per user
- Historical trend charts

---

## Dependencies

- `campaigns`, `creative_assets`, `asset_status_history`
- Notifications module (PRD 02) for optional nudges
