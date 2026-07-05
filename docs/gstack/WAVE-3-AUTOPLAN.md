# Wave 3 Autoplan — Campaign Workspace (A+B)

**Created:** 2026-06-30 via `/autoplan`  
**Direction:** Pipeline rail (A) + always-visible brief snippet (B)  
**HTML reference:** `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/campaign-workspace-a-plus-b-20260630/finalized.html`  
**Prerequisites shipped:** Wave 2a (auth, roles, single generator, view vs review)

---

## Implementation spec (from `/design-html`)

| Property | Value |
|----------|--------|
| **Mode** | plan-driven (shotgun A+B, no PNG) |
| **Screen** | `campaign-workspace` |
| **Layout** | Left pipeline rail + pinned brief snippet + stage canvas |
| **Fonts** | Fraunces (campaign title), Source Sans 3 (UI), Geist Mono (prompts) |
| **Colors** | DESIGN.md teal `#0D9488`, cream `#FEFDFB`, amber idea-first `#D97706` |
| **Rail stages** | Brief → Concepts → Copy → Images → (divider) → All assets |
| **Brief snippet** | Objective · Audience · Channels + "Edit full brief" — hidden when Brief stage active |
| **Removes** | Top-level Brief \| Generated \| Assets tabs; AppLayout duplicate "Campaign Detail" title |
| **Preserves** | Submit on cards, StatusBadge, review loop, API submit/review |

### Component inventory (new / refactored)

| Component | Role |
|-----------|------|
| `CampaignPipelineRail` | Left nav; stage state; done/active semantics |
| `BriefSnippetBar` | Compact always-visible brief; links to Brief stage |
| `CampaignWorkspace` | Composes rail + snippet + stage outlet |
| `ConceptsStage` / `CopyStage` / `ImagesStage` | Split from `GenerationPanel` internals |
| `BriefStage` | Full brief edit (from current Brief tab) |
| `AssetsStage` | Current `AssetGrid` (secondary) |

---

## Phase 1 — CEO Review

### Premises (accepted)

1. **Problem:** Campaign Detail feels like three disconnected tools (tabs, beta generator, nested generation UI).
2. **User:** Agency creator needs brief context while generating; reviewer flow stays separate.
3. **Success:** One workspace; 5-minute creator test (generate → submit) without tab hunting.

### Strategic alignment

| Check | Verdict |
|-------|---------|
| Supports "approved creative on your brand's terms" | Yes — brief snippet keeps brand grounding visible |
| Does not break review loop | Yes — review remains `/app/review`; workspace is creator-side |
| Scope vs Azure/AI migration | Independent — pure UI refactor |
| Competes with proofing tools | Strengthens generation+governance story vs upload-only tools |

### CEO decisions (auto)

| ID | Decision | Rationale (P1 completeness) |
|----|----------|----------------------------|
| C1 | Ship campaign workspace as Wave 3 hero | Highest feel-per-diff; core loop already works |
| C2 | Defer journey fork + dashboard role modes to Wave 3b | In blast radius but separate user journeys |
| C3 | Include T4 typography in same wave as workspace | Otherwise new layout still looks "un-designed" |
| C4 | Keep All assets as rail stage, not tab | Completeness — bulk ops still reachable |

### User challenge

None. Direction matches user choice (A+B).

---

## Phase 2 — Design Review

### Alignment with DESIGN.md

| DESIGN.md pattern | A+B implementation |
|-------------------|---------------------|
| Fraunces on campaign titles | Campaign header in page chrome |
| Teal primary CTA | Stage-aware primary button (Generate concepts / copy / image) |
| Amber idea-first | Journey badge in header meta row |
| Compact-comfortable density | Rail + snippet + grid; no nested card stacks |
| Anti-pattern: hidden submit | Unchanged — visible on asset cards |
| Anti-pattern: duplicate chrome | AppLayout suppresses title on `/app/campaigns/:id` |

### Information hierarchy

```
1. Campaign title + journey + approval progress
2. Brief snippet (context always on)
3. Pipeline stage (where am I?)
4. Stage canvas (prompt + generate + assets)
5. All assets (secondary, end of rail)
```

### Design decisions (auto)

| ID | Decision | Rationale (P5 explicit) |
|----|----------|-------------------------|
| D1 | Brief snippet collapses on mobile to single line + expand | Readable without stealing canvas |
| D2 | Rail becomes horizontal scroll stepper &lt;900px | Standard responsive pattern |
| D3 | Hide snippet when Brief stage active | Avoid redundant full+brief duplicate |
| D4 | Primary CTA in header mirrors active stage action | One obvious action per screen |
| D5 | T8 journey badge on header in same PR | Small; teaches dual journey |

### Design completeness score

**8/10** after Wave 3 — remaining 2: mobile review bar (T6), full empty-state table (T5).

### Taste decisions (surface at gate)

| ID | Options | Auto-choice | Why surfaced |
|----|---------|-------------|--------------|
| T-D1 | Snippet above rail vs below header only | Above rail | B wanted always-visible; placement affects scan order |
| T-D2 | Merge GenerationPanel sidebar (history) into bottom strip vs drop | Collapse to drawer | Reasonable to keep history for power users |

**Recommendation:** Snippet below header (as HTML). History in collapsible "Activity" drawer on right at xl breakpoint only.

---

## Phase 3 — Eng Review

### Architecture

```
CampaignDetail
├── CampaignHeader (title, meta, actions — owns page chrome)
├── BriefSnippetBar (reads campaign.brief; onEdit → stage brief)
├── CampaignWorkspace
│   ├── CampaignPipelineRail (stage state in URL ?stage= or local state)
│   └── stage outlet:
│       ├── BriefStage (existing brief form)
│       ├── ConceptsStage (from GenerationPanel)
│       ├── CopyStage (requires selectedConceptId — show hint)
│       ├── ImagesStage (tier controls in collapsible "Refine")
│       └── AssetsStage (AssetGrid)
└── SubmitModal (unchanged)
```

### Eng decisions (auto)

| ID | Decision | Rationale (P5 explicit, P3 pragmatic) |
|----|----------|----------------------------------------|
| E1 | Stage state in URL search param `?stage=concepts` | Shareable, back-button friendly |
| E2 | Extract stages from GenerationPanel, don't fork | DRY — one generation logic path |
| E3 | `AppLayout`: `hideHeaderTitle` when pathname matches `/app/campaigns/:id` | Minimal prop, no route registry |
| E4 | BriefSnippetBar pure presentational; brief fetch from existing campaign query | No new API |
| E5 | selectedConceptId in React context `CampaignWorkspaceContext` | Avoid prop drilling 4 levels |
| E6 | Wave 3 PR scope: T11–T16 + T-TEST-W3; defer T19 journey fork | Blast radius control |

### Files (blast radius)

| File | Change |
|------|--------|
| `CampaignDetail.tsx` | Replace tabs with workspace composition |
| `GenerationPanel.tsx` | Split into stage components or internal sections |
| `components/campaign/CampaignPipelineRail.tsx` | **new** |
| `components/campaign/BriefSnippetBar.tsx` | **new** |
| `components/campaign/CampaignWorkspace.tsx` | **new** |
| `components/layout/AppLayout.tsx` | Hide duplicate title |
| `src/styles/globals.css` | T4 font tokens |
| `index.html` | Font loader |

### Risks

| Risk | Mitigation |
|------|------------|
| Large GenerationPanel refactor | Stage extract in one PR; keep tests green per stage |
| Visual regression | T4 + workspace together; screenshot compare in `/design-review` |
| deep-link old tab URLs | Redirect `?tab=generated` → `?stage=concepts` |

### Test plan (T-TEST-W3)

- Pipeline rail switches stages
- Brief snippet hidden on brief stage
- Copy stage disabled hint without selected concept
- URL `?stage=copy` restores stage on load
- Submit still fires from concept card
- AppLayout does not render "Campaign Detail" title on campaign page

---

## Phase 3.5 — DX Review

### Developer experience

| Check | Verdict |
|-------|---------|
| New dev can find workspace entry | Single `CampaignDetail` → `CampaignWorkspace` |
| Stage addition | Add rail item + stage component + route map |
| DESIGN.md → code | finalized.html co-located with approved.json |

### DX decisions

| ID | Decision |
|----|----------|
| X1 | Add `docs/gstack/WAVE-3-AUTOPLAN.md` as ship guide |
| X2 | Link finalized.html from plan README |
| X3 | No new env vars |

---

## Implementation tasks

### Wave 3a — Campaign workspace (ship first)

- [ ] **T11 (P0, ~4h)** — `CampaignPipelineRail` + stage routing (`?stage=`)
  - Files: new `CampaignPipelineRail.tsx`, `CampaignDetail.tsx`
  - Verify: all 5 stages navigable; done/active styles; mobile horizontal rail

- [ ] **T12 (P0, ~2h)** — `BriefSnippetBar`
  - Files: new `BriefSnippetBar.tsx`
  - Verify: shows objective/audience/channels; Edit → brief stage; hidden on brief stage

- [ ] **T13 (P0, ~6h)** — `CampaignWorkspace` + replace tabs in `CampaignDetail`
  - Files: `CampaignWorkspace.tsx`, `CampaignDetail.tsx`
  - Verify: matches finalized.html structure; no Brief/Generated/Assets tabs

- [ ] **T14 (P0, ~8h)** — Refactor `GenerationPanel` into stage outlets
  - Files: `GenerationPanel.tsx` → stage components or sub-exports
  - Verify: concept→copy dependency explicit; submit wired; generation APIs unchanged

- [ ] **T15 (P1, ~1h)** — Suppress AppLayout duplicate title on campaign detail
  - Files: `AppLayout.tsx`
  - Verify: only campaign page header visible

- [ ] **T16 (P1, ~3h)** — T4 Typography (Source Sans 3 + Fraunces) in app shell
  - Files: `globals.css`, `index.html`, campaign header uses `font-display`
  - Verify: Fraunces on campaign title only; body Source Sans 3

- [ ] **T-TEST-W3 (P1, ~2h)** — Tests per eng test plan

### Wave 3b — Polish (follow-up PR)

- [x] **T17** — Generation history → Activity drawer (xl+)
- [x] **T18** — T8 journey badge on campaign header
- [x] **T19** — Restore JourneyChoice in setup fork
- [x] **T20** — Role-aware dashboard modes (creator vs reviewer home)
- [x] **T5/T6** — Empty states + mobile review bar (from UI-REBUILD-PLAN)

---

## Implementation order

```
T16 (fonts) ─┐
T11 (rail)  ─┼→ T12 (snippet) → T13 (workspace) → T14 (stages) → T15 (shell) → T-TEST-W3
```

Single PR preferred for T11–T16 (shared `CampaignDetail`).

---

## Final approval gate

### Taste decisions for your review

1. **T-D1 Brief snippet placement** — Auto: below header. OK?
2. **T-D2 Generation history** — Auto: Activity drawer at xl+. OK?
3. **T16 bundled with workspace** — Fonts + layout ship together. OK?

### User challenges

None.

### Verdict

**READY TO SHIP** Wave 3a after you confirm taste items (or accept auto-choices).

---

## GSTACK REVIEW REPORT

| Phase | Skill | Score | Open items |
|-------|-------|-------|------------|
| CEO | plan-ceo-review | Pass | C2 deferred to 3b |
| Design | plan-design-review | 8/10 | T6, T5 in 3b |
| Eng | plan-eng-review | Pass | E6 scope boundary |
| DX | plan-devex-review | Pass | — |

**Consolidated verdict:** Wave 3a (T11–T16) is scoped, references finalized HTML, and preserves the generate→submit→review loop. Proceed to `/ship` on Wave 3a.

**Artifacts:**
- HTML: `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/campaign-workspace-a-plus-b-20260630/finalized.html`
- Approved: `.../approved.json`
- Plan: this file
