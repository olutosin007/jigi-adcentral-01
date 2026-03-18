## Flow 1 – New Meta Campaign (Template‑First, Low Cost)

### 1. Overview

This flow describes how the Creative Orchestrator generates a batch of low‑cost Meta Feed creatives for a new campaign, using template‑based tools (e.g. Canva MCP) and optional Meta MCP validation, while avoiding paid generative image calls in the test‑and‑learn phase.

### 2. Actors

- **User (PM/Marketer)**: Creates a campaign and requests creatives.
- **Jigi App (UI + API)**: Captures briefs and talks to the Creative Orchestrator.
- **Creative Orchestrator (new microservice)**: Routes requests to underlying tools and aggregates results.
- **Canva MCP (or equivalent template provider)**: Provides ad templates and renders filled‑in creatives.
- **Meta MCP**: Optionally validates assets and generates ad previews for Meta placements.

### 3. Preconditions

- Brand profile exists in Jigi (colors, fonts, logos, basic guardrails).
- A Meta ad account and associated business settings are already configured at the org level (even if not yet used programmatically).
- Creative Orchestrator is deployed and reachable from the Jigi backend.
- MCP integrations (Canva, Meta) are configured and have valid auth.

### 4. Happy Path – Step‑by‑Step

1. **User creates a new campaign in Jigi**
   - In the Jigi UI, the user creates “Campaign X” with:
     - Objective (e.g. “Lead gen for Jigi onboarding”)
     - Channel: Meta (Facebook + Instagram Feed)
     - Audience description and key value props
     - Brand constraints: brand profile selection, optional overrides
     - Copy bundle: multiple headlines, body options, CTAs
     - Experiment phase: `test_and_learn`
     - Cost profile: `template_only` (no generative image calls).

2. **Jigi prepares a creative generation request**
   - Backend composes a normalized `generate-creatives` payload containing:
     - Campaign metadata (objective, audience, persona)
     - Target placements and aspect ratios (e.g. 1:1, 4:5 for Feed)
     - Copy variants and constraints (e.g. max characters, tone rules)
     - Brand requirements (logo required, color palette, font families)
     - Cost and strategy flags (`test_and_learn`, `template_only`, desired variant count).

3. **Jigi sends request to Creative Orchestrator**
   - Jigi calls a single entrypoint on the Orchestrator, e.g. `POST /generate-creatives`.
   - Jigi receives back a job ID immediately (for async tracking) or waits for a synchronous response depending on implementation choice.

4. **Orchestrator evaluates routing policy**
   - Reads:
     - Phase = `test_and_learn`
     - Cost profile = `template_only`
     - Channel = Meta Feed
   - Policy outcome:
     - Primary provider: Canva MCP (or equivalent template engine).
     - Avoid any tools that incur per‑image generative cost.
     - Target: e.g. 6 variants (3 for each aspect ratio).

5. **Template discovery via Canva MCP**
   - Orchestrator calls Canva MCP with:
     - Filter: “Facebook/Instagram ad”, Feed, 1:1 and 4:5
     - Requirements: slots for logo, headline, body, CTA
   - Canva MCP returns a ranked list of candidate templates.
   - Orchestrator selects a small set (e.g. Template A for 1:1, Template B for 4:5).

6. **Template instantiation**
   - For each selected template, Orchestrator:
     - Maps brand assets (logo, colors, fonts) into the template.
     - Chooses combinations of headline/body/CTA that satisfy length limits.
     - Ensures legal or compliance text (if any) fits within available regions.
   - It requests multiple renderings from Canva MCP:
     - A1, A2, A3 based on Template A (1:1) with different copy mixes.
     - B1, B2, B3 based on Template B (4:5).

7. **Optional Meta MCP validation and preview**
   - Orchestrator submits the generated assets to Meta MCP to:
     - Validate technical specs (dimensions, file size, format).
     - Check placement compatibility (Feed vs other placements).
     - Generate preview mocks (e.g. how it appears in the Facebook app UI).
   - For any invalid assets:
     - Orchestrator attempts a cheap automatic fix (resize, compress) using the template engine or image tooling.
     - If auto‑fix fails, the asset is marked as “needs manual correction”.

8. **Orchestrator assembles final response**
   - For each creative variant, Orchestrator stores and/or returns:
     - Creative ID and version
     - Provider and template ID (e.g. `canva:templateA`)
     - Asset URL(s) (stored in configured storage)
     - Target placements and aspect ratios
     - Validation status and any preview URLs from Meta MCP.

9. **Jigi receives and displays variants**
   - Jigi fetches the final creative batch (synchronously or via job polling/webhook).
   - The UI shows:
     - A gallery of image variants grouped by placement/aspect ratio.
     - Metadata such as template name, variant labels, and provider.
   - User can:
     - Approve or reject individual variants.
     - Tag favorites for inclusion in the initial test set.

10. **Downstream use (out of scope for this flow)**
    - Approved creatives are queued for:
      - Human review workflows (e.g. Slack/Notion).
      - Sync to Meta ad accounts for actual campaign creation.

### 5. Error / Edge Cases (v1 Handling)

- **No suitable templates found**
  - Orchestrator returns a structured error: “No eligible templates for requested placements/constraints.”
  - Jigi prompts the user to relax constraints or choose alternate channels.

- **MCP provider unavailable**
  - Orchestrator fails fast and returns a provider‑unavailable error with retry suggestions.
  - Jigi may surface a banner and allow the user to retry later.

- **Invalid or incomplete brand profile**
  - Orchestrator detects missing required assets (e.g. logo, primary color).
  - It returns a validation error pointing to the exact missing fields so Jigi can direct the user to update the brand profile.

### 6. Open Questions / TBD

- How many variants per placement should be configurable per org vs. per campaign?
- Should Meta MCP validation be mandatory or optional in early MVP?
- Where should assets be stored long‑term (e.g. Jigi storage vs. provider‑hosted links)?

