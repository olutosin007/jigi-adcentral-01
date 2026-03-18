# PRD 06 — Creative Brief Gap-Filling

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

An **agentic** module that analyses incomplete campaign briefs (missing audience, channels, requirements) and either proposes drafts from similar past campaigns or sends targeted prompts to the creator. Reduces campaigns stuck at step 0.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Reduce stalled starts | Campaigns with incomplete briefs get proactive suggestions |
| Leverage past work | Similar past campaigns inform draft suggestions |
| Minimal friction | Creator receives clear, actionable prompts to fill gaps |

---

## User Stories

### As a campaign creator
- I want to know which parts of my brief are missing or weak
- I want suggestions from similar past campaigns to fill gaps
- I want to complete my brief quickly without guessing what to add

### As a brand or agency
- I want fewer campaigns stuck in "draft brief" state
- I want briefs to be more complete before generation starts

---

## Functional Requirements

### 1. Brief fields

- **Required:** `objective`, `audience`, `channels`, `requirements` (from existing campaign/brief model)
- **Optional:** `brand_context`, `seed_idea`, etc.
- **Gap detection:** Empty or minimal (e.g. <10 chars) fields are flagged

### 2. Similar past campaigns

- **Query:** Find campaigns with similar `objective` or `brand_id` (text similarity or tags)
- **Extract:** Pull `audience`, `channels`, `requirements` from completed briefs
- **Propose:** "Similar campaign X used: Audience: [Y]. Consider adding for your brief."

### 3. Targeted prompts

- **Prompt examples:** "Add a target audience (e.g. '25–34 year old professionals')"; "Add channels (e.g. Instagram, LinkedIn)"
- **Delivery:** In-app banner or notification on campaign detail
- **Optional:** Pre-fill draft with suggested text; user can edit

### 4. UI

- **Brief editor:** "Completeness" indicator (e.g. 3/5 fields complete)
- **Gap suggestions:** Inline or sidebar with "Suggested from similar campaigns" and "Add prompt"
- **Banner:** "Your brief is 60% complete. Add audience and channels to improve generation."

### 5. Agentic behaviour

- **Trigger:** On brief save or campaign view
- **Logic:** Analyse brief → identify gaps → query similar campaigns → generate suggestions
- **Modular:** Can be an API or Base44 agent that reads brief and returns suggestions

---

## Technical Considerations

- **Similarity:** Text embedding (e.g. OpenAI) or keyword matching for "similar" campaigns
- **Privacy:** Only suggest from campaigns the user has access to

---

## Acceptance Criteria

- [ ] System identifies incomplete brief fields (audience, channels, requirements)
- [ ] Suggestions are generated from similar past campaigns (when available)
- [ ] User receives targeted prompts to fill gaps
- [ ] Brief completeness is visible in the UI
- [ ] Optional: one-click draft from suggestion

---

## Out of Scope (v1)

- Full AI brief generation
