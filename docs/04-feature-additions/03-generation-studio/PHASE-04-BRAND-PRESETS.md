# Phase 4 — Brand Presets

**Initiative:** [Generation Studio](./README.md)
**Status:** Implemented — apply `supabase/migrations/036_brand_image_presets.sql`
**Depends on:** P3 composer

---

## Goal

Higgsfield's presets are generic ("cinematic push-in"). Jigi's are **brand-scoped**: a saved look for *this* brand — style words, tier and aspect — applied in one click by anyone with access to the brand.

---

## Sprint 4.1 — Schema + data hooks

Migration `036_brand_image_presets.sql`:

```sql
brand_image_presets (
  id uuid pk, brand_id uuid fk brands on delete cascade,
  name text (1..60), style_prompt text (1..500),
  image_tier text check in (draft, refine, final) default 'refine',
  aspect_ratio text check in ('1:1','4:5','9:16','16:9') default '1:1',
  created_by uuid fk users, created_at, updated_at,
  unique (brand_id, name)
)
```

RLS mirrors brand visibility: readable/insertable by members of the brand's org **or** an agency with `agency_brand_access`; delete by creator or org admin. (Presets are not review state, so direct client writes are allowed — submit/review rules are untouched.)

- `src/lib/brand-presets.ts`: `validatePresetInput`, `applyPresetToPrompt(prompt, preset)` (appends style once; idempotent).
- Hooks (`src/hooks/useBrandPresets.ts`): `useBrandPresets(brandId)`, `useCreateBrandPreset(brandId)`, `useDeleteBrandPreset(brandId)`. Reads degrade to `[]` if 036 is not applied yet.
- Access helper `brand_preset_accessible(brand_id)` (SECURITY DEFINER) backs all four policies; update is creator-only.
- Applied style lives in the prompt as a trailing `Style: …` block; re-applying replaces it (`stripPresetStyle` / `extractPresetStyle`).

### Tests

- `brand-presets.test.ts`: validation limits; `applyPresetToPrompt` idempotent, trims, handles empty prompt.
- `brand-preset-migration.test.ts` (server suite): 036 CHECK lists match `ImageTier` and the client aspect ratio union.

---

## Sprint 4.2 — Composer chips

- `BrandPresetBar` above the composer (Images tab, brand-grounded campaigns only): chips → apply (sets tier, aspect, style); `+ Save current look` opens a small dialog (name).
- Idea-first campaigns without a brand: bar hidden (amber "add brand kit" hint not repeated — already shown elsewhere).

### Tests

- `BrandPresetBar.test.tsx`: renders chips; click applies; save validates name; hidden with no brand.

### Acceptance

- [ ] Preset saved by one agency creator is visible to a teammate on the same brand. *(RLS — verify manually after applying 036.)*
- [x] Applying a preset twice does not duplicate style text (`brand-presets.test.ts`).
