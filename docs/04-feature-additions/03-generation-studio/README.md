# 03 — Generation Studio

**Status:** P1–P4 implemented on branch `feat/gen-studio` — ready for review (apply migrations 035 + 036; P5 video deferred)
**Version:** 1.0
**Created:** October 2026
**Design system:** [`DESIGN.md`](../../../DESIGN.md) — refined utilitarian; teal = action, amber = pending / idea-first
**Product seed:** [`docs/gstack/PRODUCT_BRIEF.md`](../../gstack/PRODUCT_BRIEF.md)

---

## One-liner

**Cheaper, current models behind one router — and a studio that feels like Higgsfield, but ends in a client yes.**

---

## Why this initiative

1. **The engine is rotting.** Google shut down Imagen 4 on the Gemini API (17 Aug 2026), which is every default in our Google lane. GPT Image 1 (Azure fallback default) retires 23 Oct 2026. Nano Banana 2 (`gemini-3.1-flash-image`) retires 29 Oct 2026.
2. **Price.** Kling Image 3.0 ($0.028/image) and Nano Banana 2.1 ($0.034 @1K) match or beat what we pay today, with better quality. Replicate is 3–10× the cost of other hosts for the same open-weight models, so it moves to fallback.
3. **UX.** Category leaders (Higgsfield, Kling, Magnific, OpenArt) share patterns we lack: one composer, cost-aware model choice, one-click remix/upscale on results, saved presets. We adopt the *patterns*, not their dark/neon aesthetic.

### Success metrics

- Zero image generations routed to a retired model (enforced by unit test + runtime guard).
- Blended cost per draft image ≤ $0.035; per final image ≤ $0.06 (from `generation_log` + `content.estimated_cost_usd`).
- Generate → submit for review in ≤ 3 clicks from the Images tab.

---

## Phases

| Phase | Doc | Focus | Outcome |
|-------|-----|-------|---------|
| **P1** | [PHASE-01-ENGINE-REFRESH.md](./PHASE-01-ENGINE-REFRESH.md) | Model registry, drift guard, Nano Banana + Kling adapters, new route chain | No retired models; cheaper default lanes |
| **P2** | [PHASE-02-UPSCALE-FINAL.md](./PHASE-02-UPSCALE-FINAL.md) | `POST /api/generate/upscale` → versioned child asset | Magnific-style final step before review |
| **P3** | [PHASE-03-STUDIO-COMPOSER.md](./PHASE-03-STUDIO-COMPOSER.md) | Cost-aware tier picker, aspect ratio, Remix/Upscale on cards | Studio patterns inside DESIGN.md |
| **P4** | [PHASE-04-BRAND-PRESETS.md](./PHASE-04-BRAND-PRESETS.md) | Brand-scoped image presets | Brand memory in one click |
| **P5** | [PHASE-05-VIDEO-DEFERRED.md](./PHASE-05-VIDEO-DEFERRED.md) | Kling video, async jobs | Scaffold only (`generation_jobs` + 501 API); provider deferred |

**Order:** P1 → P2 → P3 → P4 (strict; P3 consumes the P1 catalog and P2 endpoint).

---

## Model lineup (Oct 2026 list prices, 1K unless noted)

| Tier | Primary | Fallbacks (in order) | Est. primary cost |
|------|---------|----------------------|-------------------|
| Draft | Kling Image 2.1 `kling-v2-1` | Nano Banana 2 Lite `gemini-3.1-flash-lite-image` → Azure Foundry FLUX → Replicate `flux-schnell` | $0.014 |
| Refine | Kling Image 3.0 `kling-v3` | Nano Banana 2.1 → Azure Foundry FLUX → Replicate `bytedance/seedream-4` @2K | $0.028 |
| Final | Nano Banana 2.1 `gemini-nano-banana-2.1` @2K | Kling Image 3.0 @2K → Azure Foundry FLUX → Replicate `google/nano-banana` | $0.050 |
| Upscale | Replicate `nightmareai/real-esrgan` ×2 | — | ~$0.002 (estimate) |

Final stays on Nano Banana 2.1 (not the cheaper Kling 3.0 @2K) for its in-image text rendering — ad finals usually carry a headline. Swap with `GOOGLE_IMAGE_MODEL_FINAL` / chain order if the benchmark says otherwise. Without Kling credentials, every tier falls through to Nano Banana. Nano Banana 2 Lite and 2.1 list at the same $0.0336 @1K; Lite is kept for speed only.

Prices and retirement dates live in **one place**: `server/api/lib/image-models.ts`. The client tier catalog (`src/lib/image-tiers.ts`) is drift-tested against it.

---

## Drift policy (applies to every phase)

Unit tests are the contract. Each phase adds tests that fail when code drifts from this spec:

| Guard | Test |
|-------|------|
| No default model is retired | `image-models.test.ts` |
| Env override pointing at a retired model is ignored at runtime | `image-models.test.ts` |
| Every route candidate has a registry entry with a price | `image-routing.test.ts` |
| Tier → primary model order matches the lineup table above | `image-routing.test.ts` |
| Client tier catalog cost/model == server registry | `image-catalog-drift.test.ts` |
| Provider ids accepted by DB constraint == `ImageProvider` union | `image-provider-constraint.test.ts` (parses migration 035) |
| Upscale access, validation, child-asset shape (parent, version + 1) | `upscale.test.ts`, `upscale-route.test.ts` |
| Composer renders exactly the catalog tiers + costs | `TierPicker.test.tsx` |
| Every channel ratio resolves to a supported aspect | `src/lib/image-tiers.test.ts` |
| Selected aspect reaches `/api/generate/image` | `orchestrator.test.ts` |
| Preset CHECK lists / length limits == client tiers, aspects, validation | `brand-preset-migration.test.ts` (parses migration 036) |
| Applying a preset is idempotent | `brand-presets.test.ts` |
| Submit/review never bypass API | existing `review-domain` tests (unchanged) |

---

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-12 | Direct Google + Kling adapters; no fal.ai yet | Kling preferred on price; Google key already provisioned. fal remains an option behind the same router. |
| 2026-10-12 | Keep `cost_bucket` values (`free` / `paid_fallback`) but relabel in UI as *Primary* / *Fallback* | All lanes are now paid; avoids a data migration on historic rows. |
| 2026-10-12 | Studio stays on the light DESIGN.md surface | A dark studio surface changes DESIGN.md and needs explicit approval (open question below). |
| 2026-10-12 | Video deferred to P5 | Needs async job infra; images deliver the visible win first. |
| 2026-10-26 | fal.ai provider lane ahead of Foundry/Replicate (Flux Schnell / Seedream 4 / Nano Banana) | Strategy execution Wave 2: open-weight substrate for image now and video later; Replicate remains fallback. Apply migration 037. |
| 2026-10-12 | Replicate lanes upgraded: Refine → Seedream 4 (~$0.03, 2K), Final → Nano Banana (~$0.039); Draft stays Flux Schnell ($0.003) | With only Replicate configured (Google key on free tier, no Kling key), Flux Dev was the ceiling. Per-model input builder (`buildReplicateImageInput`) is drift-tested against each model's schema enums. Replicate throttles to 6 req/min while account credit < $5. |
| 2026-10-12 | Second entry route `/app/generate` ("Generate now") alongside campaign create | Generating should not require brand + brief up front. It creates a brandless idea-first campaign named `Quick: …` and auto-runs the request in Images or Concepts, so assets, review and upscale still have a home. `/app/quick-start` redirects here. Guarded by `direct-generate.test.ts`, `GenerateNow.test.tsx`, and GenerationPanel direct-request tests (runs once, waits for session). |

## Delivery log

| Phase | Commit | Tests added |
|-------|--------|-------------|
| Docs | `c47163a` | — |
| P1 Engine refresh | `5bfa0f5` | image-models, gemini/kling adapters, routing, catalog drift, provider constraint, route sanity |
| P2 Upscale | `022c5b3` | upscale lib (13), upscale route (9), `useUpscaleImage` |
| P3 Studio composer | `d3798c5` | TierPicker (6), ImageCard (6), image-tiers (7), orchestrator aspect (2) |
| P4 Brand presets | `eedfc1f` | brand-presets (10), BrandPresetBar (6), 036 migration drift (4) |
| Finalise | this commit | full suites green: frontend 393, server API 114 |

### Open questions (need product owner)

1. **Dark studio surface** for the generation canvas only? (DESIGN.md change.)
2. **Kling credentials:** API Key (new standard) vs Access/Secret key (legacy JWT). Both are supported; set whichever your console issues.

---

## Env vars introduced

```bash
# Google (Nano Banana) — reuses GOOGLE_AI_API_KEY
GOOGLE_IMAGE_MODEL_DRAFT=gemini-3.1-flash-lite-image
GOOGLE_IMAGE_MODEL_REFINE=gemini-nano-banana-2.1
GOOGLE_IMAGE_MODEL_FINAL=gemini-nano-banana-2.1
# Kling — API key OR access/secret pair
KLING_API_KEY=
KLING_ACCESS_KEY=
KLING_SECRET_KEY=
KLING_API_BASE=https://api-singapore.klingai.com
KLING_IMAGE_MODEL_DRAFT=kling-v2-1
KLING_IMAGE_MODEL_REFINE=kling-v3
KLING_IMAGE_MODEL_FINAL=kling-v3
# Upscale
REPLICATE_UPSCALE_MODEL=nightmareai/real-esrgan
```

**Migrations (root `supabase/migrations/`):** `035_image_providers_gemini_kling.sql` (P1), `036_brand_image_presets.sql` (P4).
