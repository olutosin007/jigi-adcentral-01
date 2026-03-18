# MVP Debugging — Implementation Progress

Progress log for all sprints from [01-mvp-debugging-08march.md](01-mvp-debugging-08march.md). Sprints: 1 (Auth & Brand Onboarding), 2 (All Assets), 3 (Submit for Review Backend), 4 (Dark Mode & Image UX).

---

## Sprint 1 — Auth & Brand Onboarding (Implementation Record)

**Sprint:** 1 of 4 (from [01-mvp-debugging-08march.md](01-mvp-debugging-08march.md))  
**Goal:** Reduce perceived auth slowness and fix brand onboarding so step 1 (logo) saves and continues reliably.

---

### Files changed

| File | Changes |
|------|--------|
| `uiux/jigi-app/src/store/authStore.ts` | Initialize: set session/user and isInitialized/isLoading immediately; fetch profile in background (no await). signIn unchanged (await fetchProfile). |
| `uiux/jigi-app/src/App.tsx` | AuthInitializer shows loading UI (spinner + "Loading…") until `isInitialized`. |
| `uiux/jigi-app/src/pages/Onboarding.tsx` | Require `profile?.organisation_id` before starting wizard; "Begin setup" redirects to `/setup/organisation` if org missing. |
| `uiux/jigi-app/src/components/onboarding/OnboardingWizard.tsx` | Step 1: guard with organisation_id; toast `result.error` on createBrand failure; omit `logo_url` when value is blob URL. |
| `uiux/jigi-app/src/components/onboarding/steps/LogoUploadStep.tsx` | On upload error: do not set blob URL; show error toast only. |

---

### 1.1 Auth: Don’t block first paint on profile

**What was done**

- **authStore.initialize:** After `getSession()`, if a session exists, the store sets `session`, `user`, `isLoading: false`, and `isInitialized: true` immediately. `fetchProfile()` is then called without awaiting (fire-and-forget with `.catch()` for logging). Profile loads in the background and updates the store when ready.
- **signIn:** Left unchanged: still awaits `fetchProfile()` after sign-in so org-gated routes (e.g. onboarding) have profile when the user lands on them.
- **App.tsx:** While `!isInitialized`, `AuthInitializer` renders a minimal loading screen (centered spinner and "Loading…" text) instead of app children. Once `isInitialized` is true, the full app renders; profile may still be loading for already-signed-in users.

**Behavioural notes**

- App no longer waits for profile before first paint; users see a single loading state until session is known.
- Brand onboarding and other org-dependent flows still have profile available when reached after login (signIn awaits profile).

---

### 1.2 Brand onboarding: Ensure organisation_id before wizard

**What was done**

- **Onboarding.tsx:** Reads `profile` from `useAuthStore()`. "Begin setup" calls `handleBeginSetup()`: if `!profile?.organisation_id`, navigates to `/setup/organisation`; otherwise sets `showWizard(true)`.
- **OnboardingWizard.saveStepProgress(1):** Before calling `createBrand()`, checks `profile?.organisation_id`. If missing, shows toast "Organisation not set. Please complete organisation setup first." and returns `false`. When calling `createBrand()`, passes `organisation_id: profile.organisation_id`. On `!result.success`, shows `toast.error(result.error ?? 'Failed to save progress')` and returns `result.success` (no generic toast in `nextStep` to avoid duplicate).

**Behavioural notes**

- User cannot start the brand wizard without an organisation; they are redirected to organisation setup.
- Step 1 "Continue" uses a valid `organisation_id` and RLS/DB errors are surfaced via `result.error` in the toast.

---

### 1.3 Brand onboarding: Logo persistence (no object URL)

**What was done**

- **LogoUploadStep:** On storage upload error (including "not found" or any thrown error), no longer sets a blob URL into the form. Shows `toast.error('Logo storage is not configured. Please try again or contact support.')` and returns (or in catch, same toast). Success path unchanged: `setValue('logoUrl', publicUrl)` and success toast.
- **OnboardingWizard.saveStepProgress(1):** When building `identity` for `createBrand`, sets `logo_url` only when the form value is a persistable URL: `data.logoUrl && !String(data.logoUrl).startsWith('blob:') ? data.logoUrl : undefined`. So blob URLs are never sent to the API.

**Behavioural notes**

- If storage is misconfigured or upload fails, the user sees a clear error and no blob URL is stored; they can still continue without a logo (brand name and other step 1 fields are valid).
- No object URLs are persisted to the brand’s `identity.logo_url`.

---

### Sprint 1 acceptance criteria

| Criterion | How it is met |
|-----------|----------------|
| App does not wait for profile before first paint | Init sets isInitialized after getSession; profile loads in background. App shows loading UI until isInitialized. |
| Sign-in completes with profile for org-gated routes | signIn still awaits fetchProfile before returning. |
| User cannot start brand onboarding without organisation | Onboarding redirects to `/setup/organisation` when "Begin setup" is clicked and profile has no organisation_id. |
| Step 1 "Continue" uses valid organisation_id; RLS/DB errors visible | Wizard guards step 1 with organisation_id and shows result.error in toast. |
| No object URL in DB for logo | LogoUploadStep never sets blob URL on error; saveStepProgress omits logo_url when value starts with `blob:`. |
| Clear error when logo storage fails | Toast: "Logo storage is not configured. Please try again or contact support." |

---

## Sprint 2 — All Assets: View, Thumbnail, Delete (Implementation Record)

**Sprint:** 2 of 4 (from [01-mvp-debugging-08march.md](01-mvp-debugging-08march.md))  
**Goal:** Wire View (navigate to review page), show image thumbnails in AssetCard when `content.url` exists, and ensure Delete works for draft assets (RLS policy + bulk-delete UX).

---

### Files changed

| File | Changes |
|------|--------|
| `uiux/jigi-app/src/pages/CampaignDetail.tsx` | Added `handleViewAsset` (navigate to `/app/review/${asset.id}`); pass `onViewAsset={handleViewAsset}` to AssetGrid. |
| `uiux/jigi-app/src/components/generation/AssetCard.tsx` | Top section: when `asset.type === 'image'` and `content.url` present, render `<img>` with `object-cover`; fallback to type icon on error or no URL. Overlays (checkbox, Idea-first badge) unchanged. |
| `supabase/migrations/018_creative_assets_delete_policy.sql` | New migration: DELETE policies on `creative_assets` for draft only — "Users can delete draft assets for accessible campaigns" and "Agencies can delete draft assets for connected brands" (same campaign access as SELECT/UPDATE and INSERT). |
| `uiux/jigi-app/src/components/generation/AssetGrid.tsx` | `handleBulkDelete`: only call `onDeleteAsset` for selected assets that have `status === 'draft'`; if any selected asset is non-draft, show toast "Only draft assets can be deleted." |

---

### 2.1 View

**What was done**

- **CampaignDetail:** `handleViewAsset(asset)` calls `navigate(\`/app/review/${asset.id}\`)`. AssetGrid receives `onViewAsset={handleViewAsset}` and forwards it to each AssetCard as `onView`. Clicking "View" in the card menu navigates to the existing AssetReview page.

**Acceptance:** Clicking "View" on an asset in the All Assets tab navigates to the review page for that asset; user can use back or sidebar to return.

---

### 2.2 Thumbnail

**What was done**

- **AssetCard:** `imageUrl = asset.type === 'image' ? (asset.content as { url?: string })?.url : null`. Top section has `overflow-hidden`. When `imageUrl` is set and image has not failed load, an `<img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />` is rendered; on `onError`, state `imageError` is set and the type icon is shown instead. When there is no `imageUrl` or after error, gradient + type icon only. Checkbox and Idea-first badge remain on top.

**Acceptance:** Image assets with `content.url` show the image in the card header; concept/copy and image-without-URL show the type icon and gradient.

---

### 2.3 Delete

**What was done**

- **RLS:** Migration `018_creative_assets_delete_policy.sql` adds two DELETE policies: (1) Users can delete rows where `status = 'draft'` and campaign is in brands for the user’s organisation; (2) Agencies can delete rows where `status = 'draft'` and campaign’s brand is in `agency_brand_access` with `can_generate`. Same campaign-access logic as existing SELECT/UPDATE and INSERT.
- **Bulk delete:** In AssetGrid, `handleBulkDelete` builds `draftIds` from `filteredAssets` with `status === 'draft'`, deletes only selected ids that are in `draftIds`, and shows toast "Only draft assets can be deleted." when any selected id was non-draft.

**Acceptance:** Single-asset "Delete" works for draft assets without RLS errors. Bulk "Delete Selected" deletes only draft assets and informs the user when some selected were non-draft.

---

### Sprint 2 acceptance criteria

| Criterion | How it is met |
|-----------|----------------|
| View navigates to review page | handleViewAsset navigates to `/app/review/${asset.id}`; AssetGrid passes onViewAsset to cards. |
| Image thumbnail in card when content.url | AssetCard shows `<img>` in top section for image type with url; fallback to icon on error or no URL. |
| Delete allowed for draft assets | RLS DELETE policies added for draft-only, same campaign access as UPDATE/INSERT. |
| Bulk delete only drafts; user informed if non-draft selected | handleBulkDelete filters to draft ids only; toast when selection included non-draft. |

---

## Sprint 3 — Submit for Review Backend (Implementation Record)

**Sprint:** 3 of 4 (from [01-mvp-debugging-08march.md](01-mvp-debugging-08march.md))  
**Goal:** Make “Submit for review” work end-to-end so the asset status and notifications update correctly.

---

### Files changed

| File | Changes |
|------|--------|
| `uiux/jigi-app/vite.config.ts` | Added `server.proxy`: `/api` forwarded to `VITE_API_TARGET` or `http://localhost:3000` so API routes work in local dev when backend runs separately (e.g. `vercel dev`). |
| `uiux/jigi-app/api/assets/submit.ts` | After fetching asset: validate user can submit (brand org = campaign’s brand org, or agency with `agency_brand_access` for that brand). Return 403 if not allowed. Notification loop: insert with `.select('id').single()`, then update notification by `id` after sending email. |

---

### 3.1 Backend route and proxy

**What was done**

- **Backend:** `POST /api/assets/submit` was already implemented (JWT validation, asset fetch, status transition, update `creative_assets`, `asset_status_history`, notifications and email when target is brand_review). No new route added.
- **Dev proxy:** In `vite.config.ts`, `server.proxy['/api']` forwards to `process.env.VITE_API_TARGET || 'http://localhost:3000'`. So when running Vite dev (`pnpm dev`), `/api` calls can hit a backend (e.g. run `vercel dev` on 3000 and set `VITE_API_TARGET` if needed, or use `vercel dev` as the single dev server so `/api` is served there).

---

### 3.2 Submit handler: authorization and notifications

**What was done**

- **Authorization:** Before applying the status transition, the handler now checks that the authenticated user may submit this asset: user’s `organisation_id` (from `users`) must either match the campaign’s brand’s `organisation_id` (brand user) or have an `agency_brand_access` row for the campaign’s `brand_id` with `status = 'active'` (agency). Otherwise responds with 403 and message “You do not have permission to submit this asset for review”.
- **Notifications:** When target is brand_review (new status `submitted`), the code inserts a notification per brand reviewer, then sends email and updates that notification’s `email_sent` / `email_sent_at`. The update now uses the inserted notification’s `id` (from `.select('id').single()`) so the correct row is updated.

---

### Sprint 3 acceptance criteria

| Criterion | How it is met |
|-----------|----------------|
| Submit for review + confirm results in successful API call | Frontend already calls `submitAsset`; backend returns 200 with `{ asset, previous_status, new_status, notifications_sent }`. |
| Asset status in Supabase becomes submitted/brand_review as intended | Handler updates `creative_assets.status` and inserts `asset_status_history`. |
| Brand reviewers see asset in queue and receive notification | When target is brand_review, handler finds users in brand org with role admin/approver, inserts into `notifications`, and optionally sends email; update by notification id. |
| Local dev can hit backend | Vite proxy forwards `/api` to configurable target (default localhost:3000). |

---

## Sprint 4 — Dark Mode & Image Generation UX (Implementation Record)

**Sprint:** 4 of 4 (from [01-mvp-debugging-08march.md](01-mvp-debugging-08march.md))  
**Goal:** Make the Settings dark mode toggle functional and improve perceived performance of image generation.

---

### Files changed

| File | Changes |
|------|--------|
| `uiux/jigi-app/src/store/themeStore.ts` | New: Zustand store with theme (light/dark), persisted as `jigi-theme` in localStorage. Default from localStorage or prefers-color-scheme. setTheme persists and applies class on documentElement; rehydrate applies class. |
| `uiux/jigi-app/src/styles/globals.css` | Added `.dark` block overriding CSS variables (--background, --foreground, --card, --sidebar, etc.) for dark palette. Existing `@custom-variant dark` enables `dark:` variants. |
| `uiux/jigi-app/index.html` | Inline script before root: read `jigi-theme` or prefers-color-scheme, apply `.dark` on `<html>` before first paint to avoid flash. |
| `uiux/jigi-app/src/pages/Settings.tsx` | Use `useThemeStore`; bind Dark Mode Switch: `checked={theme === 'dark'}`, `onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}`. |
| `uiux/jigi-app/src/components/layout/Sidebar.tsx` | Added `dark:bg-sidebar dark:border-sidebar-border` so sidebar respects dark theme. |
| `uiux/jigi-app/src/components/layout/Header.tsx` | Added `dark:bg-background dark:border-border` so header respects dark theme. |
| `uiux/jigi-app/src/components/generation/GenerationLoadingState.tsx` | When `type === 'image'`, show subtext: "This may take 30–60 seconds." |

---

### 4.1 Dark mode

**What was done**

- **Theme store:** `themeStore` holds `theme` and `setTheme`. Initial theme from `localStorage.getItem('jigi-theme')` or `matchMedia('(prefers-color-scheme: dark)')`. Persist middleware saves to `jigi-theme`. On set and on rehydrate, `document.documentElement.classList.toggle('dark', theme === 'dark')` runs.
- **DOM:** Inline script in index.html runs before React so the correct class is on `<html>` before first paint. Store applies again on rehydrate and on every `setTheme`.
- **Tailwind:** `globals.css` already had `@custom-variant dark (&:is(.dark *))`. Added `.dark` CSS variable overrides. Sidebar and Header given `dark:` variants for background and border.
- **Settings:** Profile > Appearance: Dark Mode switch bound to theme store; toggling updates store, persists, and applies class.

**Acceptance:** Toggling Dark mode in Settings switches the UI to dark (and back to light). Preference persists across reloads.

---

### 4.2 Image generation loading message

**What was done**

- **GenerationLoadingState:** When `type === 'image'`, the loading state now shows the existing "Generating 1 images..." line plus a second line: "This may take 30–60 seconds." so users know the wait is expected.

**Acceptance:** During image generation, the user sees an explicit message that the step can take 30–60 seconds.

---

### Sprint 4 acceptance criteria

| Criterion | How it is met |
|-----------|----------------|
| Dark mode toggle changes UI and persists | Settings switch calls setTheme; store persists to localStorage and applies .dark on html; CSS variables under .dark drive colors. |
| Image generation shows timing expectation | GenerationLoadingState shows "This may take 30–60 seconds." when type is image. |

---

*Sprint 4 completed. All MVP debugging sprints from 01-mvp-debugging-08march.md are implemented.*

---

## Unified Creative Pipeline — Sprint 1 (Schema & Storage)

**Source:** [p1-unified-creative-implementation.md](../04-feature-additions/01-unified-creative-pipeline/p1-unified-creative-implementation.md)  
**Goal:** Extend the data model and storage infrastructure for uploaded assets.

### Files changed

| File | Changes |
|------|---------|
| `supabase/migrations/020_unified_creative_pipeline_schema.sql` | Added `source` (TEXT, default 'ai'), `original_filename` (TEXT), index on source. |
| `supabase/migrations/021_creative_assets_storage.sql` | Created `creative-assets` bucket (10MB limit), allowed MIME types, storage RLS policies. |
| `uiux/jigi-app/src/lib/upload.ts` | New: `getAllowedMimeTypes`, `isAllowedMimeType`, `validateFileSize`, `uploadFileToStorage`. |
| `uiux/jigi-app/src/hooks/useCampaignQueries.ts` | New: `useUploadAsset` hook — validates file, uploads to storage, inserts `creative_assets` with `source: 'uploaded'`. |
| `uiux/jigi-app/src/store/campaignStore.ts` | Added `source?`, `original_filename?` to CreativeAsset; `file_url?` to ConceptContent/CopyContent; `prompt_used?`, `model?` to ImageContent. |

### Acceptance criteria

| Criterion | How it is met |
|----------|---------------|
| Migration adds `source` and `original_filename` | Migration 020 adds columns and backfills existing rows. |
| Storage bucket created with RLS | Migration 021 creates bucket with INSERT/SELECT/DELETE policies. |
| Upload API or client upload path | `useUploadAsset` hook: client-side upload via Supabase Storage, then insert; RLS enforces campaign access. |
| File size limit (10MB) | `validateFileSize` in upload.ts and uploadAssetFn. |
| Allowed MIME types enforced | `isAllowedMimeType` validates before upload. |

*Sprint 1 completed. Ready for Sprint 2 (Image Upload UI).*

---

## Unified Creative Pipeline — Sprint 2 (Image Upload)

**Source:** [p1-unified-creative-implementation.md](../04-feature-additions/01-unified-creative-pipeline/p1-unified-creative-implementation.md)  
**Goal:** Enable users to upload image assets and view them alongside AI-generated images in the unified review pipeline.

### Files changed

| File | Changes |
|------|---------|
| `uiux/jigi-app/src/components/upload/UploadDropzone.tsx` | New drag-and-drop + click-to-browse dropzone component for image selection (JPG/PNG/WebP/SVG). |
| `uiux/jigi-app/src/components/upload/UploadModal.tsx` | New modal wrapper that uses `useUploadAsset` to upload images for a campaign and create `creative_assets` rows. |
| `uiux/jigi-app/src/components/generation/GenerationPanel.tsx` | Images tab: added “Upload image” button, empty-state CTA, and wired in `UploadModal` for the current campaign/user. |
| `uiux/jigi-app/src/components/generation/AssetCard.tsx` | For image assets, shows an “Uploaded” vs “AI” badge based on `asset.source`. |

### What was done

- **Upload UI & entry point**
  - Created `UploadDropzone` (drag-and-drop + file picker) and `UploadModal` (dialog + submit controls).
  - In `GenerationPanel` Images tab:
    - Added an “Upload image” button next to the Generate button.
    - Updated the empty state to mention upload and added an Upload button.
    - Mounted `UploadModal` when the Images tab is active, passing `campaign.id` and `userId`.

- **Upload flow**
  - `UploadModal`:
    - Uses `getAllowedMimeTypes('image')` to constrain accepted MIME types.
    - Uses `useUploadAsset` with `type: 'image'` and the selected file.
    - On success: shows a toast, clears state, and closes the modal.
    - If the user is not signed in (`userId` missing), shows an error toast instead of uploading.

- **Asset views**
  - `AssetCard`:
    - Derives `imageUrl` from `content.url`; if present it already shows a thumbnail.
    - Adds a small badge for image assets: “Uploaded” when `asset.source === 'uploaded'`, otherwise “AI”.
  - `AssetReview` + `AssetPreviewArea`:
    - Already render images using `content.url`, so uploaded images (which set `content.url`) display correctly and flow through submit/review/approval.

### Sprint 2 acceptance criteria

| Criterion | How it is met |
|----------|---------------|
| User can upload an image (JPG/PNG) and it appears in Images tab with status draft | UploadModal + `useUploadAsset` insert an `image` asset with `status: 'draft'` and invalidate the Images query. |
| Uploaded images show "Uploaded" badge in AssetCard | AssetCard renders an “Uploaded” badge when `asset.source === 'uploaded'`, otherwise “AI” for generated images. |
| Uploaded images display in AssetReview | AssetPreviewArea uses `content.url` to render the image, which is set by the upload flow. |
| Uploaded images flow through submit/review/approval like AI assets | All uploaded images are plain `creative_assets` rows; existing submit/review hooks and pages treat them identically to generated images. |

*Sprint 2 completed. Ready for Sprint 3 (Copy & Concept Upload).* 

---

## Unified Creative Pipeline — Sprint 3 (Copy & Concept Upload)

**Source:** [p1-unified-creative-implementation.md](../04-feature-additions/01-unified-creative-pipeline/p1-unified-creative-implementation.md)  
**Goal:** Support upload of copy and concept assets alongside AI-generated work.

### Files changed

| File | Changes |
|------|---------|
| `uiux/jigi-app/src/hooks/useCampaignQueries.ts` | Added `useCreateUploadedCopy` mutation to create `copy` assets from pasted text with `source: 'uploaded'`. |
| `uiux/jigi-app/src/components/upload/UploadModal.tsx` | Extended to support type selector (Image, Copy, Concept), paste-only copy upload, and concept uploads via storage. |
| `uiux/jigi-app/src/components/generation/AssetCard.tsx` | Updated to show “Uploaded/AI” badge for all asset types based on `asset.source`. |
| `uiux/jigi-app/src/components/review/AssetPreviewArea.tsx` | For concepts, shows an “Attached file” button when `content.file_url` is present. |

### What was done

- **Copy upload (paste-only v1)**
  - Added `useCreateUploadedCopy`:
    - Accepts `{ campaignId, userId, text }`.
    - Parses text: first non-empty line → `headline`, remaining lines → `body` (or entire text as body if single-line); `cta` left empty.
    - Inserts `creative_assets` row with `type: 'copy'`, `generation_mode: 'brand_grounded'`, `source: 'uploaded'`, `status: 'draft'`, and the parsed content.
    - Invalidates `['campaign-assets', campaignId]` on success so the Copy tab updates.
  - `UploadModal` when type **Copy**:
    - Shows a textarea for paste.
    - On submit, calls `useCreateUploadedCopy`; the new asset appears in the Copy tab and Campaign Assets sidebar.

- **Concept upload (PDF/image)**
  - `UploadModal` when type **Concept**:
    - Uses `UploadDropzone` with `getAllowedMimeTypes('concept')` (PDF, JPG, PNG, WebP).
    - Calls existing `useUploadAsset` with `type: 'concept'`, which:
      - Uploads the file to the `creative-assets` bucket.
      - Creates a `creative_assets` row with `type: 'concept'`, `source: 'uploaded'`, and `content` including `file_url`.
    - Uploaded concepts appear in the Concepts tab and Campaign Assets sidebar.

- **Badges & review experience**
  - `AssetCard`:
    - Now shows an “Uploaded” badge whenever `asset.source === 'uploaded'` for **any** asset type; otherwise “AI”.
  - `AssetPreviewArea`:
    - For concept assets, if `content.file_url` is present, shows an “Attached file” section with an **Open attachment** button linking to the file (works for PDF or image).

### Sprint 3 acceptance criteria

| Criterion | How it is met |
|----------|---------------|
| User can upload/paste copy and it appears in Copy tab | Paste-only flow in `UploadModal` uses `useCreateUploadedCopy`; new copy assets show up in Copy tab via existing filters. |
| User can upload a concept (PDF or image) and it appears in Concepts tab | Concept type in `UploadModal` uses `useUploadAsset` with `type: 'concept'`; uploaded concepts appear in Concepts tab. |
| Uploaded copy and concepts show "Uploaded" badge | `AssetCard` renders “Uploaded” for any asset with `source === 'uploaded'`. |
| AssetReview renders uploaded copy and concept content correctly | Copy uses existing copy preview; concepts use concept preview plus file attachment section when `file_url` is set. |
| PDF concept: basic viewer or download link | Concept preview shows an “Open attachment” button pointing to `content.file_url`, which opens or downloads the PDF/image in the browser. |

*Sprint 3 completed. Ready for Sprint 4 (Entry Points & Polish).* 

---

## Unified Creative Pipeline — Sprint 4 (Entry Points & Polish)

**Source:** [p1-unified-creative-implementation.md](../04-feature-additions/01-unified-creative-pipeline/p1-unified-creative-implementation.md)  
**Goal:** Make uploads accessible from key entry points and polish filtering and validation.

### Files changed

| File | Changes |
|------|---------|
| `uiux/jigi-app/src/components/generation/GenerationPanel.tsx` | Added Upload button to all tabs (Concepts, Copy, Images), reworded upload auth error, minor prompt-clear helper. |
| `uiux/jigi-app/src/components/generation/AssetGrid.tsx` | Added source filter (All/AI/Uploaded) and optional “Upload asset” button in toolbar. |
| `uiux/jigi-app/src/pages/CampaignDetail.tsx` | Wired All Assets tab to open `UploadModal`; mounted modal at page level. |

### What was done

- **Entry points**
  - `GenerationPanel`:
    - Each tab now shows an **“Upload …”** button next to Generate:
      - Concepts → “Upload concept”
      - Copy → “Upload copy”
      - Images → “Upload image”
    - The button opens the existing `UploadModal` (which already supports Image/Copy/Concept types).
  - `CampaignDetail` (All Assets tab):
    - `AssetGrid` receives `onUploadAsset`; clicking the toolbar **“Upload asset”** button opens `UploadModal` for the current campaign.
    - The modal is mounted once at the bottom of the page, shared with the All Assets view.

- **Filtering & badges**
  - `AssetGrid`:
    - New **Source** filter (All Sources | AI | Uploaded) that filters based on `asset.source` (defaulting to AI when source is missing).
  - `AssetCard`:
    - Already shows **“Uploaded/AI”** badge based on `asset.source`. This remains consistent across grid, GenerationPanel sidebar, and All Assets.

- **Validation & error polish**
  - `GenerationPanel.handleOpenUpload`:
    - Error copy updated to “You must be signed in to upload assets.” (not just images).
  - Upload flows:
    - File size/type limits remain enforced via `lib/upload.ts`, with clear toasts when missing file or pasted copy text.

### Sprint 4 acceptance criteria

| Criterion | How it is met |
|----------|---------------|
| Upload available from GenerationPanel (Concepts, Copy, Images) and All Assets | Upload button in each GenerationPanel tab + “Upload asset” button in All Assets tab wired to `UploadModal`. |
| User can filter assets by source (AI vs Uploaded) | AssetGrid adds a Source filter (All/AI/Uploaded) applied alongside type/status/search filters. |
| File size and type validation with clear errors | Existing `validateFileSize`/`isAllowedMimeType` and modal-level checks show explicit toasts when invalid. |
| A campaign can be entirely composed of uploaded assets (no AI generation) | Upload flows create fully valid `creative_assets` rows; GenerationPanel and All Assets work with uploads only. |
| Storage and RLS ensure only authorised users can upload | All uploads still go through Supabase storage RLS (`creative-assets` bucket) and `creative_assets` INSERT policies. |

*Sprint 4 completed. Unified Creative Pipeline v1 is fully implemented.* 
