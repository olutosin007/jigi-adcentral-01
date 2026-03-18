# Unified Creative Pipeline — Implementation Plan

**Source PRD:** [prd01-unified-creative-pipeline.md](../../00-feature-bank/prd01-unified-creative-pipeline.md)  
**Status:** Draft  
**Version:** 1.0  
**Created:** March 2026

---

## Overview

This document converts the Unified Creative Pipeline PRD into a multi-sprint implementation plan. The feature extends Jigi to support **uploaded offline assets** (concepts, strategy drafts, copy, graphics, image compositions) alongside AI-generated work, with all creative flowing through the same review and approval pipeline.

---

## Implementation Summary

| Sprint | Focus | Duration | Key Deliverables |
|--------|--------|----------|------------------|
| 1 | Schema & Storage | 1 week | Migration, storage bucket, RLS, upload API |
| 2 | Image Upload | 1 week | Image upload UI, AssetCard/Review, source badge |
| 3 | Copy & Concept Upload | 1 week | Copy/concept upload, content formats, preview |
| 4 | Entry Points & Polish | 1 week | GenerationPanel upload, All Assets, validation, limits |

---

## Sprint 1 — Schema & Storage Foundation

**Duration:** 1 week (5 days)  
**Goal:** Extend the data model and storage infrastructure for uploaded assets.

---

### 1.1 Database Migration

**File:** `supabase/migrations/020_unified_creative_pipeline_schema.sql`

```sql
-- Add source and original_filename to creative_assets
ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai' CHECK (source IN ('ai', 'uploaded'));

ALTER TABLE creative_assets
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Backfill existing rows
UPDATE creative_assets SET source = 'ai' WHERE source IS NULL;

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_creative_assets_source ON creative_assets(source);
```

**Notes:**
- `generation_mode` remains required; for uploaded assets use `'brand_grounded'` as default (or add migration to relax NOT NULL for uploaded).
- If `generation_mode` is NOT NULL, add a migration step to set `generation_mode = 'brand_grounded'` for uploaded assets.

---

### 1.2 Storage Bucket

**Option A:** Extend `brand-assets` with path `creative-assets/{campaign_id}/{asset_id}/{filename}`  
**Option B:** Create new bucket `creative-assets` (recommended for clearer separation)

**Migration:** `supabase/migrations/021_creative_assets_storage.sql`

```sql
-- Create creative-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creative-assets',
  'creative-assets',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload to paths for campaigns they can access
-- Storage policies: INSERT/SELECT/DELETE for authenticated users with campaign access
-- (Use path pattern: creative-assets/{campaign_id}/{asset_id}/{filename})
```

**Storage path pattern:** `{campaign_id}/{asset_id}/{filename}`

---

### 1.3 Upload Path (Client-side)

**Decision:** For v1 we use a **client-side upload path** instead of a backend `/api/assets/upload` route.

**Utilities:** `uiux/jigi-app/src/lib/upload.ts`

- `getAllowedMimeTypes(type: 'concept' | 'copy' | 'image'): string[]`
- `isAllowedMimeType(mimeType: string, type: 'concept' | 'copy' | 'image'): boolean`
- `validateFileSize(size: number): void` (10MB limit)
- `uploadFileToStorage(campaignId: string, assetId: string, file: File): Promise<string>`  
  - Uploads to `creative-assets` bucket at `{campaign_id}/{asset_id}/{filename}`
  - Returns a public URL from Supabase Storage

**Hook:** `uiux/jigi-app/src/hooks/useCampaignQueries.ts` (`useUploadAsset`)

- **Params:** `{ campaignId, type: 'concept' | 'copy' | 'image', file: File, userId: string }`
- **Flow:**
 1. Validate file size with `validateFileSize`.
 2. Validate MIME type with `isAllowedMimeType`.
 3. Generate `assetId` (UUID) on the client.
 4. Call `uploadFileToStorage(campaignId, assetId, file)` to upload the file.
 5. Build `content` based on `type`:
    - **image:** `{ url: publicUrl, prompt_used?: string, model?: string }`
    - **concept:** `{ theme: 'Uploaded concept', headlines: [], visual_direction: '', rationale: '', file_url: publicUrl }`
    - **copy:** `{ headline: '', body: '', cta: '', file_url: publicUrl }`
  6. Insert into `creative_assets` via Supabase:
     - `id: assetId`
     - `campaign_id: campaignId`
     - `created_by: userId`
     - `type`
     - `generation_mode: 'brand_grounded'`
     - `source: 'uploaded'`
     - `original_filename: file.name`
     - `content`
     - `status: 'draft'`
  7. On success, invalidate `['campaign-assets', campaignId]` in React Query.

**Campaign access:** Enforcement relies on existing `creative_assets` RLS INSERT policies; only users with campaign access can insert rows.

---

### 1.4 Acceptance Criteria

- [x] Migration adds `source` and `original_filename` to `creative_assets`
- [x] Storage bucket created with RLS policies
- [x] Upload API or client upload path exists and validates campaign access (client-side `useUploadAsset` + RLS)
- [x] File size limit (10MB) enforced
- [x] Allowed MIME types enforced

---

## Sprint 2 — Image Upload

**Duration:** 1 week (5 days)  
**Goal:** End-to-end image upload flow with UI integration.

---

### 2.1 Upload UI

**Components:**
- `upload/UploadDropzone.tsx` — Drag-and-drop + file picker; accepts JPG, PNG, WebP, SVG
- `upload/UploadModal.tsx` — Modal wrapper with dropzone, campaign/type selection, submit

**Upload flow:**
1. User selects "Upload" in Images tab (or All Assets)
2. Modal opens with dropzone
3. User drops or selects image(s)
4. On submit: upload to storage, create asset(s), close modal, refresh list

---

### 2.2 Asset Creation

**Hook:** `useUploadAsset()` or extend `useCampaignQueries`

- Call `supabase.storage.from('creative-assets').upload(path, file)` 
- Call `supabase.from('creative_assets').insert({ campaign_id, type: 'image', source: 'uploaded', content: { url: publicUrl }, original_filename, generation_mode: 'brand_grounded', status: 'draft' })`

**Content structure for image:**
```json
{
  "url": "https://...",
  "source": "uploaded"
}
```

---

### 2.3 AssetCard & AssetReview

**AssetCard:**
- For `source === 'uploaded'` and `type === 'image'`: show thumbnail from `content.url` (already supported for images)
- Add badge: "Uploaded" (vs no badge or "AI" for AI assets)

**AssetReview:**
- For uploaded image: render `<img src={content.url} />` (already supported if content.url exists)

---

### 2.4 Entry Point (Sprint 2 scope)

- Add "Upload" button in GenerationPanel Images tab (next to "Generate Image")
- Click opens UploadModal

---

### 2.5 Acceptance Criteria

- [x] User can upload an image (JPG/PNG) and it appears in Images tab with status draft
- [x] Uploaded images show "Uploaded" badge in AssetCard
- [x] Uploaded images display in AssetReview
- [x] Uploaded images flow through submit/review/approval like AI assets

---

## Sprint 3 — Copy & Concept Upload

**Duration:** 1 week (5 days)  
**Goal:** Support upload of copy and concept assets.

---

### 3.1 Copy Upload

**Formats:** TXT, DOCX, or paste from clipboard

**Copy content structure:**
```json
{
  "headline": "...",
  "body": "...",
  "cta": "...",
  "source": "uploaded",
  "file_url": "https://..." (optional, if file uploaded)
}
```

**Flow:**
- **Paste:** User pastes text; parse into headline/body/cta (simple: first line = headline, rest = body, or single field)
- **File:** Upload TXT/DOCX to storage; parse client-side or server-side; extract text; store in content or file_url

**Simplified v1:** Paste only — single text field; store as `content: { body: text, source: 'uploaded' }` with headline/cta optional.

---

### 3.2 Concept Upload

**Formats:** PDF, image (JPG, PNG) for strategy decks

**Concept content structure:**
```json
{
  "theme": "Uploaded concept",
  "description": "...",
  "source": "uploaded",
  "file_url": "https://..."
}
```

**Flow:**
- Upload PDF or image to storage
- Store `file_url` in content
- For display: use `content.file_url` or `content.url`; render PDF viewer or image

---

### 3.3 AssetCard & AssetReview

**AssetCard:**
- Copy: show `content.headline` or `content.body` snippet; badge "Uploaded"
- Concept: show thumbnail if image, or PDF icon; badge "Uploaded"

**AssetReview:**
- Copy: render `content.body` (and headline, cta) as text
- Concept: render image (if image) or PDF viewer (if PDF; use PDF.js or iframe)

---

### 3.4 Upload Modal Extensions

- Add type selector: Concept | Copy | Image
- Copy: show paste option + optional file upload
- Concept: show file upload (PDF, image)

---

### 3.5 Acceptance Criteria

- [x] User can upload/paste copy and it appears in Copy tab
- [x] User can upload a concept (PDF or image) and it appears in Concepts tab
- [x] Uploaded copy and concepts show "Uploaded" badge
- [x] AssetReview renders uploaded copy and concept content correctly
- [x] PDF concept: basic viewer (iframe or PDF.js) or download link

---

## Sprint 4 — Entry Points & Polish

**Duration:** 1 week (5 days)  
**Goal:** Full integration, validation, and UX polish.

---

### 4.1 Entry Points

- **GenerationPanel:** "Upload" button in each tab (Concepts, Copy, Images)
- **All Assets view:** "Upload assets" button or dropdown action
- **Campaign detail:** Ensure upload is accessible from campaign context

---

### 4.2 Filtering & Badges

- **AssetGrid / All Assets:** Filter by source (All | AI | Uploaded)
- **AssetCard:** Consistent "Uploaded" badge for all uploaded assets
- **GenerationPanel:** Tabs show uploaded vs AI counts if useful

---

### 4.3 Validation & Limits

- **File size:** 10MB max; show error if exceeded
- **File type:** Validate MIME; reject unsupported types with clear message
- **Campaign:** Ensure user has campaign access before upload

---

### 4.4 Error Handling

- Upload failure: toast with error message
- Storage failure: retry or clear error state
- Network error: user can retry

---

### 4.5 Acceptance Criteria

- [x] Upload available from GenerationPanel (Concepts, Copy, Images) and All Assets
- [x] User can filter assets by source (AI vs Uploaded)
- [x] File size and type validation with clear errors
- [x] A campaign can be entirely composed of uploaded assets (no AI generation)
- [x] Storage and RLS ensure only authorised users can upload

---

## Technical Notes

### Content Schema by Type

| Type   | AI content (existing)                    | Uploaded content (new)                          |
|--------|------------------------------------------|--------------------------------------------------|
| concept| `theme`, `headlines`, `visual_direction` | `theme`, `file_url`, `source`                    |
| copy   | `headline`, `body`, `cta`               | `headline`, `body`, `cta`, `file_url?`, `source` |
| image  | `url`, `prompt_used`                    | `url`, `source`, `original_filename?`            |

### Generation Mode

- Uploaded assets: default `generation_mode = 'brand_grounded'` (or relax NOT NULL for uploaded in a migration)

### RLS

- Existing `creative_assets` INSERT policies apply; ensure users with campaign access can insert.
- Storage: path must include `campaign_id`; validate user has campaign access via RLS or server-side check.

---

## Dependencies

- Supabase Storage bucket and RLS
- Existing `creative_assets` schema and status flow
- Campaign and brand access model (already in place)
- Existing AssetCard, AssetReview, GenerationPanel, AssetGrid

---

## Out of Scope (v1)

- Full DAM (taxonomies, workflows, integrations)
- PIM or CRM features
- Complex versioning or diff views
- Automated asset tagging or metadata extraction
- Virus scanning
