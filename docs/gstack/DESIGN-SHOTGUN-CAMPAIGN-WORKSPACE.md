# Design Shotgun — Campaign Workspace

**Date:** 2026-06-30  
**Screens:** Campaign Detail + Generation Panel  
**Tokens:** DESIGN.md (Fraunces + Source Sans 3, teal/cream, no gradients)

---

## Problem

Today's campaign page has competing surfaces: Brief / Generated / All Assets tabs, a duplicate AppLayout title, a Beta generator, and a GenerationPanel with nested sub-tabs + 288px sidebar. Users can't feel the **concept → copy → image** pipeline.

---

## Three directions (layout differs; brand tokens shared)

### A — Pipeline rail *(recommended)*

Vertical **stage rail** on the left: Brief → Concepts → Copy → Images. Active stage fills the main canvas. Completed stages show a green check. Brief is always one click away but doesn't compete with generation.

- **Feels:** Calm, guided, like a creative workflow tool  
- **Best for:** Brand-first users who need brief context without tab hunting  
- **Risk:** Rail takes ~200px — acceptable on desktop; collapses on mobile

### B — Split studio

Fixed **brief column** (280px, scrollable) beside a full-height generation canvas. No top-level tabs — assets live in a slim bottom strip or "All assets" drawer.

- **Feels:** Editorial, brief always visible — strong brand-grounding  
- **Best for:** Agencies who live in the brief while generating  
- **Risk:** Cramped on tablet; brief column hidden on mobile behind toggle

### C — Focus mode

**One stage per screen** with clear Next/Back. Progress dots at top. No sidebars. Advanced image controls behind "Refine" expander.

- **Feels:** Simplest, most seamless — zero parallel UI  
- **Best for:** Idea-first / quick-start users  
- **Risk:** Harder to compare multiple concepts at once

---

## Comparison board

Open in browser:

`~/.gstack/projects/Neocept-global-jigi-adcentral/designs/campaign-workspace-shotgun-20260630/comparison.html`

---

## Decision (2026-06-30)

**Chosen:** Variant **A** (pipeline rail) + **B** always-visible brief snippet.

**Finalized HTML:** `~/.gstack/projects/Neocept-global-jigi-adcentral/designs/campaign-workspace-a-plus-b-20260630/finalized.html`  
**Autoplan:** `docs/gstack/WAVE-3-AUTOPLAN.md`

**Next:** `/ship` Wave 3a (T11–T16).
