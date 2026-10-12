# Phase 1 — Engine Refresh

**Initiative:** [Generation Studio](./README.md)
**Status:** In progress
**Depends on:** —
**Unlocks:** P2 (upscale uses the registry), P3 (client catalog)

---

## Goal

Every image request routes to a live, priced model. Retired models can never be selected again — by default *or* by a stale env var.

---

## Sprint 1.1 — Model registry & drift guard

### Scope

1. `server/api/lib/image-models.ts`
   - `IMAGE_MODELS`: id → `{ provider, label, usdPerImage, maxResolution, retiresOn? }`.
   - `RETIRED_IMAGE_MODELS`: id → retirement date (Imagen 4 family, `gpt-image-1`, `gemini-3.1-flash-image`, …).
   - `isModelRetired(id, now)`; `pickModel({ envValue, fallback, now })` returns the env value unless it is retired (then logs once and returns the fallback).
   - `estimateImageCostUsd(model, resolution)`.
2. Tests: `image-models.test.ts`.

### Acceptance

- [ ] No default model in any tier is retired as of today (test uses real `Date`).
- [ ] `GOOGLE_IMAGEN_MODEL_DRAFT=imagen-4.0-fast-generate-001` in env resolves to the registry default, not Imagen.
- [ ] Every registry entry has `usdPerImage > 0`.

---

## Sprint 1.2 — Nano Banana + Kling adapters

### Scope

1. `server/api/lib/google-gemini-image.ts` — `POST {base}/models/{model}:generateContent` with `x-goog-api-key`; `generationConfig.responseModalities: ['IMAGE']`, `imageConfig: { aspectRatio, imageSize }`. Reads first `inlineData` part. Lite model is forced to `1K`.
2. `server/api/lib/kling-image.ts` — `POST /v1/images/generations` (`model_name`, `prompt`, `aspect_ratio`, `resolution`, `n: 1`), then poll `GET /v1/images/generations/{task_id}` until `succeed` / `failed` / timeout (`KLING_POLL_TIMEOUT_MS`, default 60s). Auth: `KLING_API_KEY` bearer, else HS256 JWT from `KLING_ACCESS_KEY` / `KLING_SECRET_KEY` (30-min expiry, `nbf` −5s). Downloads the result immediately (Kling purges after 30 days).
3. Remove `google-imagen.ts` (Imagen `:predict` is dead).
4. Tests: `google-gemini-image.test.ts`, `kling-image.test.ts` (mocked `fetch`; request shape, auth header, polling, failure message, timeout).

### Acceptance

- [ ] Gemini adapter sends the documented body and returns a buffer + mime type.
- [ ] Kling adapter polls until success, surfaces `task_status_msg` on failure, and times out with a retryable message.
- [ ] JWT is valid HS256 with `iss = access key`.

---

## Sprint 1.3 — Routing, schema, observability

### Scope

1. `image-routing.ts`
   - `ImageProvider` adds `google_gemini`, `kling` (keeps `google_imagen` for historic rows only — never routed).
   - New hybrid chain per [lineup](./README.md#model-lineup-oct-2026-list-prices-1k-unless-noted).
   - `azure_only` mode unchanged.
   - Route candidates carry `resolution` for cost estimation.
2. `generate/image.ts` — executes new providers; writes `content.estimated_cost_usd` and `content.image_resolution`; returns `estimated_cost_usd`.
3. Migration `035_image_providers_gemini_kling.sql` — widen `image_provider` CHECK on `generation_log` and `image_routing_events` (idempotent; same pattern as 017).
4. `health-deep.ts` — report configured image lanes and flag retired env overrides.
5. `.env.example`, `vercel.json` (`maxDuration: 60` for `api/generate/*.ts` — Kling polling).
6. UI copy: tier buttons drop "Free"; route line says *Primary lane* / *Fallback*.
7. Fix pre-existing sanity-test mock (`.update` missing on Supabase stub).

### Tests

- `image-routing.test.ts`: chain order per tier with all creds; chain skips providers without creds; `azure_only` behaviour; every candidate model is in the registry.
- `image-provider-constraint.test.ts`: migration 035 CHECK list == `ImageProvider` union.
- `generate-routes.sanity.test.ts`: success path stores `estimated_cost_usd` and `image_provider = 'google_gemini'`.

### Acceptance

- [ ] With only `GOOGLE_AI_API_KEY` set, all three tiers produce images via Nano Banana.
- [ ] With Kling creds, Refine routes to Kling first.
- [ ] Inserting `image_provider = 'kling'` succeeds after 035.

---

## Out of scope

fal.ai, video, reference-image inputs (P3+ candidates), per-org billing.
