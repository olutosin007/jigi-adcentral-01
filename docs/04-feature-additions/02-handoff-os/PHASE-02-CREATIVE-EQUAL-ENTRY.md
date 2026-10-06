# Phase 2 — Creative Equal Entry (Generate | Upload)

**Initiative:** [Handoff OS](./README.md)  
**Status:** Ready  
**Duration:** 2 sprints (~2 weeks)  
**Depends on:** P1 Sprint 1.2 (Job Creative stage shell)  
**Unlocks:** Strong Archetype 1 path; feeds P3/P4 with unified candidates

---

## Goal

Make **Generate** and **Upload** equal ways to create a **candidate** inside the Creative stage. Uploaded assets already exist in code (`source: 'uploaded'`, `UploadModal`, storage, validation helpers). This phase **positions and polishes** them as first-class citizens of the handoff spine — not a buried modal.

---

## User-facing outcomes

| Who | After P2 |
|-----|----------|
| Individual creative | Can drop Figma/export/PNG/copy into a job and Send without using AI |
| Agency creator | Same Decide path for AI and uploaded assets; source badge clear but not shaming |
| Both | Optional “run brand check” on upload when kit is ready |

---

## Sprint summary

| Sprint | Focus | Key deliverables |
|--------|--------|------------------|
| **2.1** | Creative stage dual mode | Generate \| Upload segmented control; upload drop zone as primary surface; empty states |
| **2.2** | Parity polish + brand check | Multi-file, type tags, source filters, optional compliance on upload, Send-stage source mix |

---

## Sprint 2.1 — Dual-mode Creative canvas

**Duration:** ~1 week  
**Goal:** Equal entry UI.

### Scope

1. **Segmented control** on Creative stage: **Generate** | **Upload** (persist per job in URL `?mode=generate|upload` or local preference).
2. **Upload mode canvas**
   - Large drop zone + file picker (reuse `UploadModal` / `useUploadAsset` internals; prefer inline canvas over modal-only).
   - Support existing types: image, copy, concept (match current upload API).
   - Immediate appearance in candidate grid with `Uploaded` badge (existing `AssetCard` source badge).
3. **Generate mode**
   - Existing production chain (concept → copy → image) hosted as today; explore shortcuts remain secondary.
4. **Empty states**
   - Upload: *Drop work made elsewhere — same approval loop.*
   - Generate: keep brand-readiness banner behavior from P3/P4 brand work.

### Acceptance

- [ ] User can complete Brief → Upload image → see asset in Creative without opening Generate.
- [ ] Uploaded asset is `draft`, selectable on Send stage (P1).
- [ ] Generate path not regressed.
- [ ] Source badge visible on cards and in Send checklist.

### Out of scope

- Guest Decide; new file-type support beyond current allowlist; DAM browsing.

---

## Sprint 2.2 — Parity polish & brand check

**Duration:** ~1 week  
**Goal:** Trust and throughput for mixed candidates.

### Scope

1. **Multi-file upload** with progress and per-file errors (within existing size/MIME limits).
2. **Type tagging** on upload (image / copy / concept) — confirm before commit when ambiguous.
3. **Filters** on Creative / Decisions: All · AI · Uploaded.
4. **Optional brand check**
   - CTA on uploaded asset: *Check against brand* — reuse compliance / validation pipeline (`validateImported*` / drift) where present.
   - Incomplete kit → amber: *Guidance only — complete brand kit for stronger checks* (no fake high scores).
5. **Send stage**
   - Mixed AI + uploaded selection in one send.
   - Checklist shows source + type.
6. **Analytics**
   - Event: `candidate_added` with `source: ai|uploaded`; `send_mixed_sources` boolean.

### Acceptance

- [ ] Multi-file upload works within limits; failures are actionable.
- [ ] Brand check on upload never claims certainty when kit incomplete.
- [ ] Mixed Send submits each asset via existing submit API.
- [ ] Unit/integration coverage for upload → draft → list filters.

### Out of scope

- Auto-OCR of PDFs into copy fields (nice-later).
- Client-side redesign of Decide (P3/P4).

---

## Technical notes

| Area | Guidance |
|------|----------|
| Reuse | `UploadModal`, `hooks/useCampaignQueries` upload mutations, `lib/upload`, `source` column |
| Avoid | Second asset table or parallel status machine |
| API | Prefer existing upload paths; only add endpoints if brand-check-on-demand is missing |
| UI | Inline Creative upload canvas; keep modal as progressive enhancement / mobile fallback |

---

## Design notes

- Upload canvas should feel like a **studio intake bench**, not a settings form.
- Equal visual weight on Generate | Upload — do not teal-hierarchy Generate as “the real product.”
- Source badge: muted chip, not a warning.

---

## Exit criteria (phase)

- [ ] Archetype 1 can demo: upload → send → (authenticated) approve without generating.
- [ ] AI and uploaded candidates share Send / Decisions / Approved stages.
- [ ] Brand check honesty rules enforced in UI.
