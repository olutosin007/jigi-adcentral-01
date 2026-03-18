# PRD 01 — Unified Creative Pipeline

**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

Extend Jigi to support **uploaded offline assets** (concepts, strategy drafts, copy, graphics, image compositions) alongside AI-generated work. All creative—whether AI or human-created—flows through the same review and approval pipeline. This positions Jigi as a **unified creative pipeline** rather than an AI-only tool.

---

## Goals & Success Criteria

| Goal | Success Metric |
|------|----------------|
| Support parallel workflows | Users can upload human-created assets while AI generates drafts in the same campaign |
| Unified review experience | Uploaded and AI assets appear in the same review queue with identical status/approval flow |
| Standalone campaigns | End-to-end campaigns can be created entirely from uploaded assets (no AI required) |
| Minimal friction | Upload UX is comparable to existing asset creation flow |

---

## User Stories

### As an agency creative
- I want to upload a concept deck from Figma so it can be reviewed alongside AI-generated concepts in the same campaign
- I want to upload a final design asset so it can be approved by the brand without re-generating it
- I want to upload strategy drafts and copy for campaigns where the creative was done elsewhere

### As a brand reviewer
- I want to see all assets—AI and uploaded—in one review queue so I don’t need to switch tools
- I want to approve or reject uploaded assets using the same workflow as AI-generated ones

### As a brand or agency
- I want to run a campaign entirely from uploaded assets when I need full control over creative (no AI)

---

## Functional Requirements

### 1. Asset types & upload

- **Supported types:** concept, copy, image (same as existing `creative_assets.type`)
- **Upload formats:**
  - **Concept:** PDF, DOCX, or image (JPG, PNG) for strategy decks
  - **Copy:** TXT, DOCX, or paste from clipboard
  - **Image:** JPG, PNG, WebP, SVG (for compositions/graphics)
- **Metadata:** Each uploaded asset must include `source: 'uploaded'` (vs `source: 'ai'`) for filtering and analytics

### 2. Asset model extension

- Add `source` column to `creative_assets`: `'ai' | 'uploaded'`
- Add `original_filename` (optional) for uploaded assets
- Store file URLs in `content` (e.g. `content.url` for images, `content.file_url` for PDFs)
- Reuse existing `status`, `campaign_id`, `parent_asset_id` for hierarchy

### 3. Storage

- Use Supabase Storage bucket (e.g. `creative-assets` or extend `brand-assets`)
- Path pattern: `{campaign_id}/{asset_id}/{filename}` or similar
- RLS: upload allowed for users with campaign access (same as existing asset creation)

### 4. Campaign flow

- **Campaign creation:** Unchanged; user creates campaign as today
- **Asset creation:** Either generate (AI) or upload (new)
- **Upload entry points:** Add "Upload" button in GenerationPanel per tab (concepts, copy, images); or a dedicated "Upload assets" action in campaign/All Assets view
- **Review:** Uploaded assets enter draft, then follow same status flow (agency_review → submitted → brand_review → approved/rejected/changes_requested)

### 5. UI components

- **Upload modal/dropzone:** File picker + drag-and-drop; show preview for images
- **AssetCard:** Display uploaded assets with thumbnail (image) or preview (PDF/concept); badge "Uploaded" vs "AI"
- **AssetReview:** Render uploaded content (image viewer, PDF viewer, or text display for copy)

---

## Technical Considerations

- **File size limits:** Define max (e.g. 10MB per file) and enforce via API and storage
- **Virus scanning:** Optional; consider for production
- **Preview generation:** For PDFs, consider server-side thumbnail or client-side PDF.js
- **Versioning:** Optional; first version can be single-file per asset; later add version history

---

## Acceptance Criteria

- [ ] User can upload a concept (PDF/image) and it appears in the Concepts tab with status draft
- [ ] User can upload copy (TXT/DOCX or paste) and it appears in the Copy tab
- [ ] User can upload an image (JPG/PNG) and it appears in the Images tab with thumbnail
- [ ] Uploaded assets have `source: 'uploaded'` and are distinguishable from AI assets in the UI
- [ ] Uploaded assets flow through the same review/approval pipeline as AI assets
- [ ] A campaign can be entirely composed of uploaded assets (no AI generation required)
- [ ] Storage and RLS are configured so only authorised users can upload

---

## Out of Scope (v1)

- Full DAM (taxonomies, workflows, integrations)
- PIM or CRM features
- Complex versioning or diff views
- Automated asset tagging or metadata extraction

---

## Dependencies

- Supabase Storage bucket and RLS policies
- Existing `creative_assets` schema and status flow
- Campaign and brand access model (already in place)
