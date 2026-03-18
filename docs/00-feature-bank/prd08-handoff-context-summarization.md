# PRD 08 — Handoff & Context Summarization

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

When ownership changes (agency→brand, or person A→B), an **agentic** module generates a concise **handoff note**: key decisions, rejected directions, open questions, asset status. Reduces context loss in distributed teams.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Preserve context | New owner receives a clear summary of campaign state |
| Reduce ramp-up time | New owner understands what's done and what's next |
| Seamless handoff | Handoff triggered explicitly or on status change |

---

## User Stories

### As an agency handing off to brand
- I want to generate a handoff summary when I submit for brand review
- I want the brand to see key decisions and open questions

### As a brand receiving handoff
- I want to receive a summary when an agency submits work
- I want to know what was rejected and why

### As a team member taking over
- I want a handoff note when someone assigns me a campaign
- I want to know asset status and next actions

---

## Functional Requirements

### 1. Handoff trigger

- **Explicit:** User clicks "Hand off" / "Generate handoff" on campaign
- **Implicit:** On status change (e.g. asset submitted for brand_review)
- **Optional:** On assignee change (if campaign has owner/assignee)

### 2. Summary content

- **Key decisions:** Approved concepts, approved copy, direction chosen
- **Rejected directions:** What was tried and rejected; why (if in notes)
- **Open questions:** From comments or feedback
- **Asset status:** Count by status (draft, in review, approved, rejected)

### 3. Data sources

- **creative_assets:** Status, type, content
- **asset_status_history:** Transitions, notes
- **asset_comments:** Open questions, feedback
- **campaigns:** Brief, objective

### 4. Output format

- **Structured:** Handoff note stored in `campaign_handoffs` or `campaign_notes`
- **Display:** Rendered in campaign detail or as notification body
- **Optional:** Email with handoff summary

### 5. Agentic behaviour

- **Logic:** Query campaign + assets + history + comments → generate summary (LLM or template)
- **Modular:** API or Base44 agent that reads data and returns summary

---

## Technical Considerations

- **LLM:** Use for natural-language summary; optional fallback to template
- **Privacy:** Only include data the recipient has access to

---

## Acceptance Criteria

- [ ] Handoff can be triggered explicitly (e.g. "Generate handoff")
- [ ] Handoff can be triggered implicitly on submit for brand review
- [ ] Summary includes key decisions, rejected directions, open questions, asset status
- [ ] Summary is stored and visible to the recipient
- [ ] Optional: email with handoff summary

---

## Out of Scope (v1)

- Full project handoff (assignee change, permissions)
- Handoff templates per user
- Version history of handoffs

---

## Dependencies

- `campaigns`, `creative_assets`, `asset_status_history`, `asset_comments`
- Notifications module (PRD 02) for delivery
- Optional: LLM for summary generation
