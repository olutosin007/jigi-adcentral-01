# Phase 3 — Studio Composer

**Initiative:** [Generation Studio](./README.md)
**Status:** Implemented
**Depends on:** P1 catalog, P2 upscale endpoint

---

## Goal

Bring the Higgsfield / Kling / OpenArt *interaction* patterns into the Images tab — on the existing light DESIGN.md surface.

| Pattern (peer) | Jigi version |
|----------------|--------------|
| Model picker with cost (Higgsfield, OpenArt) | **Tier picker**: Draft / Refine / Final with model name, ~cost, speed |
| Aspect chip in composer (Kling) | **Aspect ratio** select; defaults to the campaign's first channel |
| Remix from history (Kling, OpenArt) | **Remix** on image cards: loads that image's prompt into the composer |
| Upscale (Magnific) | **Upscale** on image cards → P2 endpoint, shows new version |
| Submit from result | Already on `ImageCard` — keep primary |

---

## Sprint 3.1 — Tier picker + aspect ratio

- `src/lib/image-tiers.ts` — `IMAGE_TIER_OPTIONS`: `{ id, label, model, estCostUsd, speed, description }`. Single client source of truth.
- `src/components/generation/TierPicker.tsx` — radio group (`role="radiogroup"`), teal selected state, cost in `tabular-nums`.
- Aspect ratio select (`1:1`, `4:5`, `9:16`, `16:9`) passed as `aspectRatio` through `useGenerateImage` → orchestrator → API (API already accepts `aspect_ratio`; `4:5` added to the union).
- Route line copy: *Primary lane* / *Fallback*, plus `~$0.03`.
- Default aspect = `nearestSupportedAspect(channel.image_dimensions.aspect_ratio)` for the campaign's lead channel (e.g. LinkedIn `1.91:1` → `16:9`, `6:5` → `1:1`).
- Cards render in the image's own aspect and show `aspect · resolution` instead of a fixed `1024×1024`.

### Tests

- `TierPicker.test.tsx`: renders 3 options with costs; arrow/click selects; `aria-checked` correct.
- `src/lib/image-tiers.test.ts`: `nearestSupportedAspect` mapping + drift guard that every channel in `CHANNEL_CONSTRAINTS_LIBRARY` resolves to a supported ratio.
- `orchestrator.test.ts`: `aspect_ratio` is forwarded to `POST /api/generate/image` (previously dropped → always 1:1).
- `image-catalog-drift.test.ts` (server suite): every client tier's `model` and `estCostUsd` match the server registry's primary model for that tier.

---

## Sprint 3.2 — Card actions: Remix + Upscale

- `ImageCard`: new optional `onRemix`, `onUpscale`, `isUpscaling` props. Upscale hidden once the asset is already upscaled (`content.upscaled_from`).
- `GenerationPanel`: Remix sets prompt + tier + aspect from the asset and scrolls the composer into view; Upscale calls `useUpscaleImage`, toasts, and opens the new version.
- Version badge (`v2`) on cards with `version > 1`.

### Tests

- `ImageCard.test.tsx`: Remix/Upscale buttons render only when handlers given; Upscale hidden for upscaled assets; Submit remains present for drafts.

### Acceptance

- [x] Generate → Upscale → Submit for review in ≤ 3 clicks from the Images tab (Upscale icon on card → preview modal → Submit).
- [x] No new colours or fonts outside DESIGN.md (teal `primary` selection, existing muted/card tokens).
