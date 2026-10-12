# Phase 2 — Upscale as the Final Step

**Initiative:** [Generation Studio](./README.md)
**Status:** Planned
**Depends on:** P1 registry
**Unlocks:** P3 card action

---

## Goal

Magnific's lesson: the last step before a client sees an image is a crisp, high-resolution version. Upscaling creates a **new version** of the asset, so the original stays intact and review history stays honest.

---

## Sprint 2.1 — `POST /api/generate/upscale`

### Contract

```http
POST /api/generate/upscale
Authorization: Bearer <supabase jwt>
{ "asset_id": "uuid", "scale": 2 }        // scale ∈ {2, 4}, default 2
```

**200** → `{ asset, image_url, model, estimated_cost_usd }`
**400** missing/invalid `asset_id` or `scale`; source is not an image or has no URL
**401** unauthenticated · **404** asset not visible to caller (checked with the caller's JWT, so RLS applies)
**429** per-user daily cap reached (shares `IMAGE_CAP_PER_USER_DAILY`)

### Behaviour

1. Load source asset with a **user-scoped** Supabase client (RLS decides visibility).
2. Run `REPLICATE_UPSCALE_MODEL` (default `nightmareai/real-esrgan`) with `{ image: url, scale }`.
3. Store to `generated-images/{campaign_id}/{ts}-upscaled.{ext}`.
4. Insert child asset: `type: image`, `status: draft`, `parent_asset_id: source.id`, `version: source.version + 1`, `content = { ...source.content, url, upscaled_from, upscale_scale, upscale_model, image_tier: 'final', estimated_cost_usd }`.
5. Log `generation_log` + `image_routing_events` (`image_provider: replicate`, `image_tier: final`).

Pure helpers live in `server/api/lib/upscale.ts` (`validateUpscaleRequest`, `buildUpscaledAssetInsert`) so they are unit-testable without HTTP.

### Tests

- `upscale.test.ts`: validation matrix; child insert keeps lineage, bumps version, never copies `status`/review fields; cost from registry.
- `upscale-route.test.ts`: 405 / 401 / 400 / 404 / success path with mocked Supabase + Replicate.

### Acceptance

- [ ] Upscaled asset appears as a new draft with `parent_asset_id` set.
- [ ] Original asset unchanged.
- [ ] Route registered in `api/generate/upscale.ts` and `scripts/server-local.mjs`.

---

## Sprint 2.2 — Client hook

- `useUpscaleImage()` in `src/hooks/useCampaignQueries.ts` → invalidates campaign assets.
- `api-client.ts` `upscaleImage()`.
- Test: hook calls the endpoint with the asset id and invalidates the campaign query key.
