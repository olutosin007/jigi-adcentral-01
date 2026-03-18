## Flow 2 – Regenerate Underperforming Creative (Cost‑Aware Iteration)

### 1. Overview

This flow describes how the Creative Orchestrator generates new variants to replace an underperforming creative, prioritising low‑cost template tweaks over expensive, net‑new image generation. The goal is to iterate quickly within the same creative concept while respecting campaign cost constraints.

### 2. Actors

- **Jigi Analytics / Scheduler**: Detects underperforming creatives based on metrics.
- **Jigi Backend**: Initiates regeneration requests to the Orchestrator.
- **Creative Orchestrator**: Decides which providers to use and generates new variants.
- **Template Provider (e.g. Canva MCP)**: Reuses templates and layouts to produce new variants.
- **Advanced Provider (e.g. Adobe MCP)**: Optionally creates a small number of higher‑fidelity variants.

### 3. Preconditions

- At least one creative has been served in a live or test campaign and has performance data (CTR, CPC, etc.).
- The original creative’s metadata is stored by the Orchestrator (provider, template ID, copy used).
- Cost and routing policies are configured (e.g. max variants, escalation rules).

### 4. Happy Path – Step‑by‑Step

1. **Underperformance is detected**
   - A scheduled job or analytics process in Jigi reviews performance data.
   - For creative `C_orig` (e.g. A1), metrics show:
     - CTR below a defined threshold relative to peers.
     - Or other criteria (e.g. low conversion rate, high CPA).
   - The system flags `C_orig` as “Underperforming – candidate for regeneration.”

2. **Jigi initiates regeneration**
   - Jigi backend sends a `regenerate-creatives` request to the Orchestrator including:
     - Identifier of `C_orig` and its campaign/context.
     - Performance summary (e.g. CTR, impression count).
     - Regeneration intent: “Optimize within existing concept (template‑first).”
     - Any updated constraints (e.g. new copy to try, stricter brand rules).

3. **Orchestrator retrieves creative lineage**
   - Orchestrator looks up `C_orig` and retrieves:
     - Original provider (e.g. `canva`).
     - Template ID (e.g. Template A).
     - Input parameters (headline/body/CTA used, color choices).
     - Channel and placements.
   - It also reads the campaign’s cost profile and phase (likely still `test_and_learn`).

4. **Routing decision – template‑first**
   - Based on config and cost profile, Orchestrator decides:
     - First line of action: reuse the same template provider and template.
     - Generate N new low‑cost variants (e.g. 3–5).
     - Optionally, allow at most 1 “premium” variant from an advanced provider if configured.

5. **Variant generation via template provider**
   - Orchestrator calls the template provider (Canva MCP) with:
     - Template A and original layout configuration.
     - A set of new copy combinations drawn from:
       - Headlines/CTAs not yet tested.
       - Minor visual tweaks allowed by the template (e.g. accent color, image crop).
   - The provider returns a new batch:
     - `C_1`, `C_2`, `C_3` – each tagged as replacements for `C_orig`.

6. **Optional premium variant via advanced provider**
   - If configured (e.g. “1 premium variant per underperformer allowed”):
     - Orchestrator constructs a single advanced variant request for Adobe MCP:
       - Keeps the same overall concept (message, audience).
       - Enhances layout, hierarchy, or subtle graphics without radical concept change.
     - Adobe MCP returns `C_premium` for the same placements.
   - This step is optional and should still be bounded by cost rules.

7. **Validation and compatibility checks**
   - As in Flow 1, Orchestrator may run technical validation (e.g. via Meta MCP) to:
     - Confirm each new variant is compatible with existing placements.
     - Detect any issues introduced by new text lengths or layout choices.

8. **Update internal state and mark replacements**
   - Orchestrator stores:
     - Each new creative’s metadata and linkage: `replaces = C_orig`.
     - Generation method (template provider vs. advanced provider).
     - Any inferred “hypotheses” (e.g. “Testing stronger CTA,” “Shorter headline”).

9. **Response to Jigi**
   - Orchestrator returns:
     - The list of new candidate creatives (`C_1`, `C_2`, `C_3`, optional `C_premium`).
     - Mappings back to the original creative (so Jigi can show them as successors).
     - Validation status and basic rationale (e.g. “New headline variant,” “Alternate CTA”).
   - Jigi updates its UI so that:
     - The original creative is marked “Underperforming – replacements available.”
     - New variants are shown side‑by‑side as proposed replacements.

10. **Selection and activation (outside this flow)**
    - A human or automated rule chooses which replacement(s) to activate.
    - Separate flows push those chosen variants into the ad account and pause or retire `C_orig`.

### 5. Error / Edge Cases (v1 Handling)

- **Missing lineage metadata**
  - If Orchestrator cannot find the original template or provider:
     - It returns a structured error indicating that `C_orig` cannot be regenerated automatically.
     - Jigi can prompt for manual regeneration or a fresh creative request.

- **Copy pool exhausted**
  - If all existing headlines/CTAs have already been tested:
     - Orchestrator can either:
       - Refuse regeneration and ask for new copy options, or
       - Recycle top‑performing copy from sibling creatives (configurable).

- **Cost limits reached**
  - If campaign/org has hit its daily or total budget for regenerated creatives:
     - Orchestrator rejects the request with a “cost limit reached” status.
     - Jigi may delay or batch regeneration requests until the next window.

### 6. Open Questions / TBD

- How many regeneration cycles per creative should be allowed before forcing a new concept?
- Should the system automatically retire `C_orig` once a replacement is selected?
- How should hypotheses about why a creative underperformed be represented and fed back into routing?

