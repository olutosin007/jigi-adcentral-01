# Creative Flow: Concept → Copy Suite → Image — Implementation PRD

**Parent initiative:** Unified Creative Pipeline ([`p1-unified-creative-implementation.md`](./p1-unified-creative-implementation.md))  
**Status:** Draft — ready for sprint execution  
**Version:** 1.0  
**Created:** April 2026  

---

## 1. Executive summary

### 1.1 Problem

The current happy path produces **strong concept territories** (theme, headlines, visual direction, rationale) but **thin copy** (headline, body, CTA × two variants only). That mismatch understates what agencies need between “idea” and “key art.” Image generation is not consistently **anchored** to approved or primary copy, so visual output can drift from the line being sold.

### 1.2 Product intent

Adopt a **default creative sequence** that is flexible in the UI but clear as a mental model:

1. **Concept** — strategic territory (current shape is acceptable for v1; light enhancements optional).  
2. **Copy / copy suite** — channel-aware, structured outputs aligned with existing **`CopyOutputSchema`** / **`CopyDisplayFormat`** in code, not a parallel JSON dialect.  
3. **Image** — generated using **concept + selected copy fields** (primary line / key message) so key art matches messaging.

### 1.3 Success criteria

| Area | Measure |
|------|--------|
| Copy depth | Each variant surfaces beyond headline/body/CTA: channel/deliverable, key message, counts, optional multi-CTA / format-specific fields where relevant. |
| Flow | From a selected concept, **copy** is the encouraged next step; image remains available without blocking. |
| Image | Image request payload includes **copy lineage** (asset id or primary text fields) when user generates from an approved or selected copy variant. |
| Quality | Existing **validation / compliance** paths can consume richer copy metadata (mandatory/exclusion checks, disclaimers flag) when generated. |
| Regression | Concept-only and idea-first journeys still work; no breaking change to stored asset types (`concept` \| `copy` \| `image`). |

### 1.4 Non-goals (this PRD)

- Replacing the entire CCO authoring UX or adding net-new channels beyond what the campaign brief already supports.  
- Full legal review workflow automation.  
- Motion / video asset generation.  
- Mandatory change to database columns if **`creative_assets.content` JSONB** can absorb extended copy fields (preferred).  

---

## 2. Current technical baseline (reference)

| Layer | Location / notes |
|-------|------------------|
| Concept prompt & JSON | `server/api/generate/text.ts` — `SYSTEM_PROMPTS.concept`, `variations` N/A (uses `concepts` array). |
| Copy prompt & JSON | Same file — `SYSTEM_PROMPTS.copy` currently restricts to `headline`, `body`, `cta` per variation. |
| Copy enrichment types | `src/lib/copy-enforcement/schema.ts` — `CopyOutputSchema`, `CopyDisplayFormat`, `normalizeCopyToDisplay`. |
| Orchestration | `src/lib/ai/orchestrator.ts` — `generateCopy`, `assemblePrompt` when `campaignId` + `brandId`; passes `concept_context`. |
| API client | `src/lib/api-client.ts` — `GenerateTextRequest` includes `concept_context`. |
| UI | `GenerationPanel`, concept/copy detail modals (`ConceptDetailModal`, `CopyDetailModal` or equivalents under `src/components/generation/`). |
| Image generation | `server/api/generate/image.ts`, orchestrator `generateImage`, prompt assembly track `image`. |

---

## 3. Target copy payload (generation contract)

### 3.1 Principles

- **One contract:** Extended fields should map into **`CopyDisplayFormat`** / optional full **`CopyOutputSchema`** where validation expects them.  
- **Two variants** remain the default generation count unless product explicitly changes it later.  
- **Backward compatibility:** `normalizeCopyToDisplay` and orchestrator must accept **legacy** `{ headline, body, cta }` rows already in DB.  

### 3.2 Suggested JSON shape (LLM output)

High-level structure (exact field names to be finalized in Sprint 1):

```json
{
  "variations": [
    {
      "variant_label": "A | B (optional)",
      "variant_intent": "string — e.g. proof-led vs bold (optional)",
      "channel_id": "string — align with campaign brief first channel or explicit selection",
      "deliverable_type": "string — e.g. social_feed, story, rsa, email",
      "key_message": "string — single-minded line tied to concept theme",
      "content": {
        "headline": "string",
        "body": "string",
        "cta": "string",
        "cta_alternates": ["string"],
        "primary_text": "string (optional — platform-specific)",
        "subject_line": "string (optional)",
        "preview_text": "string (optional)"
      },
      "character_count": 0,
      "tone_adherence": 0,
      "key_message_delivery": "string",
      "mandatory_inclusions_check": [{ "requirement": "string", "present": true }],
      "exclusions_check": [{ "exclusion": "string", "violated": false }],
      "legal_disclaimers_appended": false,
      "copy_id": "string (optional uuid or deterministic id from client)"
    }
  ]
}
```

**Note:** Not every optional field must be shown in UI v1; generation can omit channel-specific blocks unless the campaign channel warrants them. The PRD requires **schema + normalization** support first; **progressive disclosure** in UI is acceptable.

### 3.3 Concept → copy instruction (prompt behaviour)

System/user augmentation (conceptual):

- **Ground copy in** `concept_context.theme`, deliberately relate to **concept headlines** (echo, sharpen, or replace with rationale).  
- **Translate** `visual_direction` into **copy-relevant cues** (mood, proof, setting) rather than pasting visual direction as body copy.  
- Respect **brand_context** (tone, preferred/avoided words) when present; idea-first omits strict brand list but keeps clarity.  

---

## 4. Image generation threading

### 4.1 Inputs

When user triggers image generation **after** copy exists:

- **`concept_id`** / concept content (theme, visual_direction) — existing behaviour.  
- **`copy_asset_id`** OR embedded **`primary_line`** / **`key_message`** from selected copy variant — **new or wired**.  
- Existing **lineage** (`cco_version`, `bio_version`, `prompt_hash`) from prompt assembly where available.  

### 4.2 Behaviour

- **Assembled image prompt** should prioritise **approved or selected headline/key message** as the narrative anchor; visual direction moulds style.  
- Optional: **“Generate image from this copy”** on Copy Detail passes variant index + campaign id.  

---

## 5. Sprint plan (implementation phases)

Sprints are **sequenced** to reduce risk: contract and normalization first, then UI, then flow, then image threading, then hardening.

---

### Sprint 1 — Copy generation contract & server normalization

**Duration:** ~1 week  
**Goal:** LLM outputs a **richer, validated** copy structure; API and orchestrator **normalize** into `CopyDisplayFormat` / stored `content`.

#### Deliverables

1. **`server/api/generate/text.ts`**
   - Replace or extend `SYSTEM_PROMPTS.copy` with the target JSON structure (Section 3.2).  
   - Adjust `max_tokens` / temperature if needed for longer JSON.  
   - Ensure `normalizeParsedContent` (or equivalent) coerces missing optional arrays to `[]` and fills `character_count` when absent (compute from strings).  

2. **`src/lib/ai/orchestrator.ts`**
   - Map API `variations` into `CopyResult[]` with all optional fields.  
   - Preserve `concept_context` and assembled prompt path (`use_prompt_as_system`).  

3. **`src/lib/copy-enforcement/schema.ts`**
   - Extend `CopyDisplayFormat` / helpers if new nested `content` fields require flattening for legacy UI consumers.  
   - Ensure `normalizeCopyToDisplay` accepts **both** legacy flat `{ headline, body, cta }` and **nested** `content` objects from variations.  

4. **`src/lib/api-client.ts` / types**
   - Document extended shapes in TypeScript interfaces if responses are typed narrowly today.  

5. **Unit tests**
   - `normalizeCopyToDisplay` with legacy payload, new payload, and mixed fields.  
   - Orchestrator mapping test with mocked `generateText` response (optional but recommended).  

#### Exit criteria

- POST `/api/generate/text` with `type: 'copy'` returns parseable JSON matching the new contract in dev.  
- Saved assets in `creative_assets` for type `copy` store extended `content` without migration **or** migration is documented if a NOT NULL constraint forces defaults.  

#### Sprint 1 — Implementation log

| Date | Notes |
|------|--------|
| 2026-04 | Shipped: expanded `SYSTEM_PROMPTS.copy`, `max_tokens` 2800 for copy, safe `normalizeParsedContent` coercion for variations + nested `content`, `CopyDisplayFormat` / `CopyResult` suite fields, `normalizeCopyToDisplay` rich + legacy paths, `countCopyDisplayChars`, validation uses extended counts, tests in `src/lib/copy-enforcement/schema.test.ts`. Orchestrator unchanged (already maps via `normalizeCopyToDisplay`). |

---

### Sprint 2 — Copy UI: detail & list surfaces

**Duration:** ~1 week  
**Goal:** Users can **read and act on** richer copy in the product.

#### Deliverables

1. **Copy detail modal (or equivalent)**
   - Sections: variant label/intent, channel + deliverable, **key message**, headline/body/CTA, **CTA alternates**, optional primary text / subject / preview.  
   - Show **character count** and, if available from CCO, **limit hints** (read-only v1).  
   - Collapsible **checks**: mandatory inclusions, exclusions, legal disclaimer flag.  

2. **Copy cards / list** (`AssetCard` or generation grid)
   - Subtitle or chips: channel, deliverable, truncated key message.  

3. **Accessibility & empty states**
   - Graceful fallbacks when optional fields are missing (idea-first / short responses).  

#### Exit criteria

- Two variants remain visible and distinguishable.  
- No runtime errors when older assets lack new keys.  

#### Sprint 2 — Implementation log

| Date | Notes |
|------|--------|
| 2026-04 | Shipped: `CopyDetailModal` — suite layout (variant, channel/deliverable chips, key message, body, primary text, subject/preview, CTA + alternates, character count + channel guide via `getPrimaryCopyBudgetChars`, tone adherence, collapsible generation checks, separate pipeline validation). Clipboard includes suite fields. `CopyCard` — chips + key line + richer copy-to-clipboard. `AssetCard` — copy subtitle chips + key snippet. `GenerationPanel` passes channel hint and prefers `variant_label` from content. Tests: `services.test.ts` for copy budget helper. |

---

### Sprint 3 — Flow UX: concept → copy → image (soft guidance)

**Duration:** ~1 week  
**Goal:** **Default mental model** matches concept → copy → image without removing expert shortcuts.

#### Deliverables

1. **Concept detail**
   - **Primary CTA:** e.g. “Generate copy from this concept” / “Go to copy” (exact copy to match product voice).  
   - **Secondary:** “Generate image” remains available; tooltip or one-line hint: *Key art works best after copy.*  

2. **Generation panel**
   - When a concept is selected and user switches to **Copy** tab, optionally **surface context** (“Generating from: [theme]”).  
   - Optional: pre-fill or lock **concept selection** for the next copy generation.  

3. **Routing / state**
   - Ensure React Query / store passes `concept_id` + `concept_context` consistently into `generateCopy` mutations (audit `useCampaignQueries` / `GenerationPanel`).  

#### Exit criteria

- User testing script: create concept → generate copy → see enriched modal → proceed to image without dead ends.  

#### Sprint 3 — Implementation log

| Date | Notes |
|------|--------|
| 2026-04 | Shipped: `ConceptDetailModal` — primary **Generate copy**, secondary **Generate image** with tooltip; `onGoToCopy` wires to Copy tab + selected concept. `GenerationPanel` — context banner on Copy tab (“Generating from: …” + flow hint); Images tab copy-first tip; `ConceptCard` menu “Generate copy” / “Generate image” with sublines; `GenerateCopyParams` JSDoc for `conceptAssetId`. |

---

### Sprint 4 — Image generation: copy-aware prompts

**Duration:** ~1 week  
**Goal:** Image prompts **use** selected copy so key art aligns with messaging.

#### Deliverables

1. **`assemblePrompt` / image track**
   - Accept **copy snippet** (headline + key_message or full variant) when provided.  
   - Ordering: **message anchor → visual direction → brand constraints**.  

2. **`server/api/generate/image.ts` + request body**
   - Optional fields: `copy_asset_id`, `key_message`, `headline_anchor` (names TBD; avoid redundant DB round-trips if client sends strings).  

3. **UI entry points**
   - **Copy detail:** “Generate image from this variant.”  
   - **Image tab:** Optional picker: “Anchor on copy variant A/B.”  

4. **Drift / lineage**
   - Persist reference to copy asset id in image asset `content` or lineage metadata if schema already supports (`lineage`, `prompt_hash`).  

#### Exit criteria

- Generating image from a specific copy variant reproduces **visually relevant** results in qualitative review; logging shows prompt includes copy anchor.  

#### Sprint 4 — Implementation log

| Date | Notes |
|------|--------|
| 2026-04 | Shipped: `CopyImageAnchor` + `buildCopyAnchorPromptBlock`; orchestrator `generateImage` inserts messaging block after assembled CCO prompt (or before user visual direction for idea-first `buildImagePrompt` path), forwards `copy_*` fields to `/generate/image`, attaches `copy_asset_id` / headline / key message on `ImageResult`. Server persists anchor fields on `creative_assets.content` and logs when `copy_asset_id` is present. `GenerateImageParams` + `generateAndSaveImage` pass `copyAnchor`. `CopyDetailModal` — **Generate image**; `GenerationPanel` — optional **Messaging anchor** `<select>` on Images tab + handler from copy modal. |

---

### Sprint 5 — Compliance, validation, and polish

**Duration:** ~0.5–1 week  
**Goal:** End-to-end quality and operational safety.

#### Deliverables

1. **Validation pipeline**
   - `validation-pipeline` / `copy-enforcement` consume **new fields** (counts vs limits, exclusion flags).  
   - Surface **validation_warnings** in Copy Detail when present.  

2. **Compliance pass**
   - Optional `type: 'compliance'` follow-up for long-form regulatory campaigns (out of scope for automatic trigger unless product requests).  

3. **Telemetry / logging**
   - `generation_log` entries include **copy schema version** or hash of prompt template revision (lightweight).  

4. **Documentation**
   - Update internal dev docs: copy JSON contract, migration notes for legacy assets.  

#### Exit criteria

- QA checklist passes for brand-grounded and idea-first campaigns.  
- No P1 bugs on save, review, or submit for copy/image.  

#### Sprint 5 — Implementation log

| Date | Notes |
|------|--------|
| 2026-04 | Shipped: `normalizeCopyToDisplay` preserves `validation_warnings` + `exclusions_violated` from AI/storage; `coerceValidationWarnings` exported. `validateCopy` — rule pass respects model `exclusions_violated`, low `tone_adherence` advisory, `mergeCopyValidationWarnings` for AI + CCO warnings. `validateImportedCopy` + orchestrator `generateCopy` merge model `validation_warnings` with rule output; brand-voice line merged into warnings when score under 50. Validation pipeline copy `scores` include `tone_adherence`. `generation_log.copy_prompt_revision` migration + server constant `COPY_PROMPT_REVISION` on copy success/error rows. Compliance generation remains on-demand only (code comment). Tests: `validation.test.ts`, schema test for warnings. Dev contract: **Appendix C** (below). |

---

### Sprint 6 (optional) — Depth toggle & channel packs

**Duration:** ~1 week (if approved after Sprint 5)  
**Goal:** **Quick vs full suite** generation; channel-specific packs (e.g. Meta vs email) driven off CCO.

#### Deliverables

- UI toggle or setting: “Quick (headline-heavy)” vs “Full suite.”  
- Prompt branching per `deliverable_type` / channel template from `prompt-assembly/templates.ts`.  

#### Exit criteria

- Measurable reduction in user edits for one pilot channel (internal metric).  

---

## 6. Dependencies & risks

| Risk | Mitigation |
|------|------------|
| Token cost / latency for larger JSON | Tune `max_tokens`; keep Sprint 6 optional; shorten optional fields when channel unknown. |
| DB / API shape drift | Single normalization layer; version prompts; tests on `normalizeCopyToDisplay`. |
| Overwhelming UI | Progressive disclosure; sensible defaults; hide empty optional sections. |
| Image quality regression | A/B prompts in staging; keep copy anchor optional for idea-first. |

---

## 7. Open questions (resolve in Sprint 1 kickoff)

1. Should **`content` JSON** in `creative_assets` remain flat for DB queries, or is nested `content` object acceptable everywhere?  
2. Do we require a **DB migration** for generated copy, or is JSONB-only sufficient?  
3. Exact **channel_id** vocabulary: strict CCO enum vs free string for v1?  
4. Should **two variants** always share one `deliverable_type` or can they differ (A/B test across formats)?  

---

## 8. Document history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04 | Product / Engineering | Initial PRD (p2) for concept → copy suite → image. |

---

## Appendix A — File touch list (indicative)

| Sprint | Likely files |
|--------|----------------|
| 1 | `server/api/generate/text.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/copy-enforcement/schema.ts`, `src/hooks/useCampaignQueries.ts` |
| 2 | `src/components/generation/*Detail*.tsx`, `AssetCard.tsx`, types in `src/lib/ai/types.ts` |
| 3 | `GenerationPanel.tsx`, concept modal component(s), routing state |
| 4 | `server/api/generate/image.ts`, `src/lib/prompt-assembly/*`, orchestrator image path |
| 5 | `src/lib/validation-pipeline/*`, `src/lib/copy-enforcement/validation.ts`, tests |

---

## Appendix B — Alignment with existing PRD artefacts

- **Copy Output Schema (PRD 07):** This p2 PRD intentionally **activates** fields already defined in `CopyOutputSchema` rather than introducing a conflicting schema.  
- **Unified pipeline (p1):** Uploads and AI assets remain in one review queue; extended copy metadata applies to **`source: 'ai'`** copy rows; uploaded copy may stay sparse until users edit.  

---

## Appendix C — Copy JSON contract & legacy assets (Sprint 5)

**Canonical shape (display / `creative_assets.content` for copy):** Flattened `CopyDisplayFormat` — `headline`, `body`, `cta`, optional suite fields (`variant_label`, `channel`, `key_message_delivery`, nested `content` is normalized away on read). **Counts:** `character_count` should reflect headline + body + cta + suite text (`countCopyDisplayChars`). **Validation:** Model may supply `validation_warnings[]` and `exclusions_violated`; the app merges those with CCO-driven checks via `mergeCopyValidationWarnings` after a rule-only `validateCopy` pass. Re-running the validation pipeline does not duplicate rows when messages match.

**Legacy rows:** `{ headline, body, cta }` only — still valid; normalization fills `character_count` from the three fields. Missing suite metadata is optional in UI.

**Telemetry:** `generation_log.copy_prompt_revision` matches server `COPY_PROMPT_REVISION` in `server/api/lib/copy-prompt-revision.ts` — bump when the copy system prompt or expected JSON contract changes.

---

*End of document.*
