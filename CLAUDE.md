# Jigi App — Agent context

## Product brief (read first for rebuild / major features)

**`docs/gstack/PRODUCT_BRIEF.md`** — vision, core flows, tech anchor, gstack workflow. Use as the single seed when rebuilding or significantly improving the app.

Full spec: `docs/JIGI_PROJECT_SPECIFICATION.md`

## Skill routing (gstack)

| Intent | Skill |
|--------|--------|
| Save session context | `/context-save` |
| Restore session | `/context-restore` |
| Turn intent into GitHub issue | `/spec` |
| Full plan review (CEO/design/eng/DX) | `/autoplan` |
| UX direction before refactor | `/design-consultation` |
| Implement + merge | `/ship` |
| QA pass | `/qa` |

## Repo layout

- **App:** `uiux/jigi-app/` — run `pnpm dev:full` from there
- **Docs:** `docs/` — MVP flows, UI phases, creativegen
- **DB:** `uiux/jigi-app/supabase/migrations/` + root `supabase/`

## Conventions

- Human review is **in-app** (not Composio/Slack). See `docs/02-creativegen-mvp/03-human-review-in-app.md`.
- Submit/review must use `POST /api/assets/submit` and `POST /api/assets/review`, not direct client status updates.
- Prefer minimal, focused diffs; match existing patterns in `uiux/jigi-app/src/`.

## Design System

Always read **DESIGN.md** before making any visual or UI decisions.
All font choices, colors, spacing, layout patterns, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
Preview artifact: `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/design-consultation-preview.html`
