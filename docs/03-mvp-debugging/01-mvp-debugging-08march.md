# MVP Debugging — 8 March (Full Implementation Plan)

**Created:** 8 March 2026  
**Purpose:** Resolve issues identified during pre–Sprint 10 review. This document splits fixes into logical sprints with full implementation detail.

---

## Issues Summary

| # | Issue | Root cause (summary) |
|---|--------|----------------------|
| 1 | Authentication / login slow | Sequential getSession + fetchProfile; no loading gate; profile blocks render |
| 2 | Image generation slow | Backend/model latency; no per-step progress for image |
| 3 | Create-a-brand flow fails at step 1 | Missing organisation_id (RLS); logo object URL not persistable |
| 4 | All Assets: View doesn’t work | onViewAsset not passed to AssetGrid |
| 5 | Submit for review “mocked” | Frontend calls real API; backend /assets/submit missing or failing |
| 6 | Delete doesn’t work | Only draft deletable; RLS or UX for non-draft |
| 7 | No image thumbnail in All Assets | AssetCard always shows type icon, never content.url for images |
| 8 | Dark mode toggle doesn’t work | Switch has no state; no theme provider or html class |

---

## Sprint 1: Auth & Brand Onboarding

**Goal:** Reduce perceived auth slowness and fix brand onboarding so step 1 (logo) saves and continues reliably.

### 1.1 Auth: Don’t block first paint on profile

**Files:** `uiux/jigi-app/src/store/authStore.ts`, `uiux/jigi-app/src/App.tsx` (optional)

**Implementation:**

1. **authStore.ts — Initialize**
   - After `getSession()`, set `isInitialized: true` and `isLoading: false` immediately.
   - If `session` exists, call `fetchProfile()` without awaiting; run it in the background and update `profile` when it resolves.
   - This allows the app to render (e.g. landing or shell) while profile loads.

2. **authStore.ts — signIn**
   - Option A: Keep `await get().fetchProfile()` so post-login redirect has profile (needed for org-gated routes).  
   - Option B: Set user/session, set `isLoading: false`, then call `fetchProfile()` in background and update store when done; show a lightweight “Loading profile…” only on routes that need `profile` (e.g. onboarding).

3. **App.tsx — Optional loading gate**
   - In `AuthInitializer`, if `!isInitialized` (and optionally `isLoading`), render a minimal loading UI (spinner or skeleton) instead of full app, so the user sees one clear state instead of flicker. Once `isInitialized` is true, render `children` even if profile is still loading for non–org-gated routes.

**Acceptance criteria:**
- App does not wait for profile before first paint (or shows a single loading state until session is known).
- Sign-in completes as soon as session is set; profile can load in background where acceptable.
- Brand onboarding still has access to `profile?.organisation_id` when the user reaches it (e.g. after setup flow).

### 1.2 Brand onboarding: Ensure organisation_id before wizard

**Files:** `uiux/jigi-app/src/pages/Onboarding.tsx`, `uiux/jigi-app/src/components/onboarding/OnboardingWizard.tsx`, `uiux/jigi-app/src/store/brandStore.ts`

**Implementation:**

1. **Onboarding.tsx**
   - Before showing “Begin setup,” ensure the user has an organisation: e.g. read `profile` from `useAuthStore()`; if `!profile?.organisation_id`, redirect to `/setup/organisation` (or show a message: “Complete organisation setup first”) and do not set `showWizard(true)` until org is set.
   - Optionally pass `initialData` into `OnboardingWizard` if resuming (e.g. from saved draft or brand edit); for first-time create, `brandId` and `initialData` can remain undefined.

2. **OnboardingWizard.tsx — saveStepProgress(1)**
   - Before calling `createBrand()`, assert `profile?.organisation_id` is non-empty. If empty, show a toast: “Organisation not set. Please complete organisation setup first.” and return `false` so the user cannot advance until they complete setup.
   - Use `organisation_id: profile!.organisation_id` (or a guard that redirects to setup) so the INSERT always satisfies RLS.

3. **createBrand error handling**
   - In `brandStore.ts`, ensure `createBrand` returns `{ success: false, error: message }` on RLS or DB errors. In the wizard, show `toast.error(result.error)` when `!result.success` so the user sees “Organisation required” or similar instead of a generic “Failed to save progress.”

**Acceptance criteria:**
- User cannot start brand onboarding without an organisation; they are redirected or prompted to complete organisation setup.
- On step 1, “Continue” calls `createBrand` with a valid `organisation_id` and the brand is created; step 2 is shown.
- If RLS or DB fails, a clear error message is shown.

### 1.3 Brand onboarding: Logo persistence (no object URL)

**Files:** `uiux/jigi-app/src/components/onboarding/steps/LogoUploadStep.tsx`, Supabase storage (bucket + RLS)

**Implementation:**

1. **Supabase**
   - Ensure the `brand-assets` storage bucket exists (see `supabase/combined-migrations.sql` or equivalent).
   - Ensure storage RLS allows the authenticated user to INSERT into `brand-assets` (e.g. for path `logos/*`). If missing, add a policy such as: authenticated users can upload to `logos/` within their org (or a public upload policy for logos if acceptable).

2. **LogoUploadStep.tsx**
   - Keep the existing upload to `brand-assets` with path `logos/${fileName}`. On success, use `getPublicUrl(filePath)` and `setValue('logoUrl', publicUrl)`.
   - If upload fails (e.g. bucket not found or RLS denies):
     - Do **not** fall back to `URL.createObjectURL(file)` for the value that gets saved to the database. Either show an error: “Logo storage is not configured. Please contact support.” or show a clear “Using local preview only; logo will not be saved” and still allow advancing only if you persist the file elsewhere (e.g. base64 in a temp table). Prefer fixing storage so the normal path works.
   - If you must support “local preview only” for dev, store a flag in form state (e.g. `logoUrlIsLocal: true`) and in `saveStepProgress(1)` do not send `logo_url` to `createBrand` when the URL is local (so you don’t persist a blob URL). Show a short message: “Logo saved locally for this session only.”

**Acceptance criteria:**
- In production/staging, logo upload succeeds to Supabase storage and a stable public URL is saved to the brand’s `identity.logo_url`.
- After refresh or on another device, the logo still loads (no object URL in DB).
- If storage is misconfigured, the user sees a clear error and does not “save” an invalid URL.

---

## Sprint 2: All Assets — View, Thumbnail, Delete

**Goal:** Wire View, show image thumbnails in the All Assets grid, and make Delete behave correctly.

### 2.1 Wire “View” for an asset

**Files:** `uiux/jigi-app/src/pages/CampaignDetail.tsx`, `uiux/jigi-app/src/components/generation/AssetGrid.tsx` (already passes through), optional modal or route

**Implementation:**

1. **CampaignDetail.tsx**
   - Add state for the asset being viewed, e.g. `const [viewingAsset, setViewingAsset] = useState<CreativeAsset | null>(null)`.
   - Implement a handler: `const handleViewAsset = (asset: CreativeAsset) => { setViewingAsset(asset) }`.
   - Pass it to AssetGrid: `onViewAsset={handleViewAsset}`.

2. **View experience**
   - **Option A (modal):** Render a modal (e.g. Dialog) when `viewingAsset !== null`. For `viewingAsset.type === 'image'`, show an `<img src={(viewingAsset.content as { url?: string })?.url} />`; for copy, show headline/body/CTA; for concept, show theme and description. Include a close button that sets `setViewingAsset(null)`.
   - **Option B (route):** Navigate to `/app/review/${viewingAsset.id}` so the existing AssetReview page is used. Then `handleViewAsset` becomes: `navigate(\`/app/review/${asset.id}\`)`.

   Choose one and implement it consistently.

**Acceptance criteria:**
- Clicking “View” on an asset in the All Assets tab opens either a modal or the review page for that asset; the user can see the asset content and close or go back.

### 2.2 AssetCard: Show image thumbnail when available

**Files:** `uiux/jigi-app/src/components/generation/AssetCard.tsx`

**Implementation:**

1. In the card’s top section (the coloured block that currently shows only the type icon):
   - If `asset.type === 'image'` and the asset has a URL in content, e.g. `const imageUrl = (asset.content as { url?: string })?.url`, and `imageUrl` is truthy:
     - Render an `<img src={imageUrl} alt="" className="h-full w-full object-cover" />` (or similar) so the image fills the thumbnail area. Keep the gradient as a fallback background behind the image if desired, or use a neutral background.
   - Else (concept, copy, or image without URL):
     - Keep current behaviour: gradient + type icon.

2. Ensure the image area has a fixed height (e.g. same as current `h-28`) and `object-cover` so layout doesn’t jump. Optionally add a loading state or `onError` to fall back to the icon if the image fails to load.

**Acceptance criteria:**
- For image assets with `content.url`, the All Assets card shows the actual image in the top section. Other assets still show the type icon and gradient.

### 2.3 Delete asset: Clarify behaviour and fix

**Files:** `uiux/jigi-app/src/hooks/useCampaignQueries.ts`, `uiux/jigi-app/src/pages/CampaignDetail.tsx`, `uiux/jigi-app/src/components/generation/AssetCard.tsx` (if you change when Delete is shown)

**Implementation:**

1. **Current behaviour:** `useDeleteAsset` deletes only rows with `status === 'draft'`. So “Delete” in the UI should only be shown for draft assets (already the case in AssetCard: `onDelete && asset.status === 'draft'`).

2. **Ensure RLS allows delete:** Supabase RLS on `creative_assets` must allow the current user to delete draft assets (e.g. where campaign belongs to their org or they are the creator). If delete fails with a permission error, add or adjust the DELETE policy so the agency/brand user who owns the campaign can delete draft assets.

3. **UX:** If the user tries to delete a non-draft asset (e.g. via a future bulk action), show a toast: “Only draft assets can be deleted.” In the single-asset menu, keep showing Delete only when `asset.status === 'draft'` so no change needed there unless you explicitly want to allow “archive” or soft-delete for other statuses later.

**Acceptance criteria:**
- Delete is only offered for draft assets; clicking it removes the asset and refreshes the list.
- No RLS errors when deleting a draft asset the user is allowed to delete.

---

## Sprint 3: Submit for Review Backend

**Goal:** Make “Submit for review” work end-to-end so the asset status and notifications update correctly.

**Files:** Backend that serves `API_BASE` (e.g. Vite proxy or separate server), `uiux/jigi-app/src/lib/api-client.ts`, Supabase `creative_assets` and notifications.

**Implementation:**

1. **Confirm backend route**
   - The frontend calls `submitAsset(request)` which does `POST ${API_BASE}/assets/submit` (see `api-client.ts`). Ensure the app’s dev proxy (e.g. in `vite.config.ts`) forwards `/api` to the backend that implements this route. If the backend is in another repo or service, document the contract: POST body `{ asset_id, target: 'brand_review' | 'agency_review', message?: string }`, response 200 + JSON.

2. **Implement or fix `/assets/submit`**
   - Backend should:
     - Validate the JWT (e.g. from `Authorization: Bearer <token>`), map to user id.
     - Validate that the asset exists and belongs to a campaign the user can submit for (e.g. agency member for that campaign).
     - Update `creative_assets` set `status = request.target` (and optionally store the `message` in a comments or history table).
     - If target is `brand_review`, create a notification for the brand reviewer(s) and optionally send email (reuse existing notification/email helpers if present).
   - Return 200 with a simple body e.g. `{ ok: true }` or the updated asset so the frontend’s `submitAsset.mutateAsync` resolves and `onSuccess` invalidates queries.

3. **Frontend**
   - No change required if the API contract is correct; the existing `handleSubmitModalConfirm` and `useSubmitAsset` already call this API. If the backend returns a different status code or error shape, adjust `api-client` to map it to a thrown Error with a clear message so the toast shows the right text.

**Acceptance criteria:**
- Clicking “Submit for review” and confirming in the modal results in a successful API call.
- Asset status in Supabase becomes `submitted` or `brand_review` as intended.
- Brand reviewers see the asset in the review queue and receive a notification (if that flow exists).

---

## Sprint 4: Dark Mode & Image Generation UX

**Goal:** Make the Settings dark mode toggle functional and improve perceived performance of image generation.

### 4.1 Dark mode

**Files:** New small theme module, `uiux/jigi-app/src/main.tsx` or root layout, `uiux/jigi-app/src/pages/Settings.tsx`, `uiux/jigi-app/index.html` (optional), Tailwind config if needed.

**Implementation:**

1. **Theme store or context**
   - Create a minimal theme layer, e.g. `uiux/jigi-app/src/store/themeStore.ts` (Zustand) or `uiux/jigi-app/src/contexts/ThemeContext.tsx`.
   - State: `theme: 'light' | 'dark'`. Default: read from `localStorage.getItem('jigi-theme')` or `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`.
   - Persist: on change, `localStorage.setItem('jigi-theme', theme)` and apply to DOM (see below).

2. **Apply to DOM**
   - When `theme` is set, run: `document.documentElement.classList.toggle('dark', theme === 'dark')`. Run once on init and on every theme change. Ensure this runs in the same place that holds the theme state (e.g. in a `useEffect` in a provider component that wraps the app).

3. **Tailwind**
   - If using Tailwind v3/v4 with `darkMode: 'class'`, the `dark` class on `html` will enable `dark:` variants. No change needed if already set. If not, set `darkMode: 'class'` in `tailwind.config.js/ts` and add `dark:` variants to key components (sidebar, cards, inputs, etc.).

4. **Settings.tsx**
   - Use the theme store/context: `const theme = useThemeStore(state => state.theme)` (or `useContext(ThemeContext)`).
   - Bind the Dark Mode Switch: `checked={theme === 'dark'}` and `onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}`.

**Acceptance criteria:**
- Toggling “Dark mode” in Settings changes the UI to dark (and back to light). Preference persists across reloads.

### 4.2 Image generation: Loading and progress

**Files:** `uiux/jigi-app/src/components/generation/GenerationPanel.tsx`, any component that shows “Generating…” for images.

**Implementation:**

1. **Explicit “Generating image…” state**
   - When `generateImage.isPending` is true (or the panel’s image-generation step is in progress), show a clear message: “Generating image… This may take 30–60 seconds.” so the user knows the wait is expected.

2. **Optional: Timeout or retry**
   - If the backend supports long-running jobs (e.g. creative-router job id), consider polling for completion and showing “Step 2/3: Generating image…” to set expectations. Otherwise, keeping a clear message and possibly a spinner is sufficient.

**Acceptance criteria:**
- During image generation, the user sees an explicit message that the step can take 30–60 seconds; perceived slowness is explained.

---

## Sprint Summary

| Sprint | Focus | Deliverables |
|--------|--------|--------------|
| 1 | Auth & brand onboarding | Faster auth init; org required for brand; logo saved to storage only |
| 2 | All Assets UX | View wired; image thumbnail in card; delete only draft, RLS fixed |
| 3 | Submit for review | Backend `/assets/submit` implemented/fixed; status and notifications |
| 4 | Dark mode & image UX | Theme provider + Settings toggle; image generation loading message |

---

## Implementation Order

Recommended order: **Sprint 1 → Sprint 2 → Sprint 3 → Sprint 4**. Sprints 1 and 2 unblock users most; Sprint 3 depends on backend; Sprint 4 is polish.

---

*End of 01-mvp-debugging-08march.md*
