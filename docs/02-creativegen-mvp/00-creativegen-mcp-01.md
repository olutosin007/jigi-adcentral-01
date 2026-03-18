## Creative Router Microservice – MCP Implementation Plan

**Version:** 0.1  
**Related specs:**  
- `01-new-meta-campaign.md` (Flow 1 – New Meta Campaign)  
- `02-regenerate-underperformer.md` (Flow 2 – Regenerate Underperformer)  
- `03-human-review-with-composio.md` (Flow 3 – Human Review with Composio)  

---

## 1. Goals and Scope

- **Primary goal**: Build a standalone **Creative Router microservice** that orchestrates low‑cost creative generation and iteration across MCP‑based tools (Canva MCP, Meta MCP, Adobe MCP, Composio), while exposing a clean, narrow API to the core Jigi app.
- **Key properties**:
  - **Cost‑aware**: Prefer template‑based, low‑marginal‑cost generation in test‑and‑learn phases.
  - **Vendor‑agnostic**: Abstracts over multiple MCP providers via a unified interface.
  - **Rollbackable**: Can be bypassed via feature flags in Jigi; infra and data are isolated.
  - **Extensible**: New providers or flows can be added without breaking the Jigi boundary.
- **Out of scope (for this plan)**:
  - Direct ad account management and campaign creation in Meta/Google/TikTok.
  - Full production‑grade analytics; only basic metrics and logs are required initially.

---

## 2. High‑Level Architecture

- **Creative Router Microservice**
  - Stateless HTTP API (REST) with optional async job processing.
  - Internal modules:
    - **API Layer** – validates and normalises requests from Jigi.
    - **Routing Engine** – decides which providers and strategies to use (template vs generative; Canva vs Adobe; use Meta MCP validation or not).
    - **Provider Adapters** – MCP client wrappers for:
      - Canva MCP (template search + fill + render)
      - Meta MCP (asset validation + previews)
      - Adobe MCP (advanced/premium variants)
      - Composio MCP (Slack + Notion + other toolkits for review workflows)
    - **State & Lineage Store** – minimal persistence of creative jobs, variants, and lineage.
    - **Config & Policy Store** – cost tiers, feature flags, routing strategies.
    - **Observability Layer** – structured logs, basic metrics, provider call tracing.

- **Jigi App Integration**
  - Jigi only interacts with Creative Router via:
    - **Synchronous APIs**:
      - `POST /generate-creatives` – maps to **Flow 1**.
      - `POST /regenerate-creatives` – maps to **Flow 2**.
      - `POST /send-for-review` – maps to **Flow 3**.
      - `GET /jobs/{id}` – fetches job status and results (if async).
    - **Optional webhooks** from Creative Router to Jigi for long‑running operations.
  - **Feature flag in Jigi**:
    - `creative_router.enabled`:
      - `false` → Jigi uses current/manual creative flows.
      - `true` → Jigi calls Creative Router for supported flows, with graceful fallback on errors.

- **MCP Integration Boundary**
  - Creative Router talks to:
    - **Direct MCP providers** – e.g. Canva MCP, Meta MCP, Adobe MCP.
    - **Composio MCP gateway** – for multi‑tool workflows (Slack, Notion, etc.), leveraging:
      - Agent Auth
      - Tool Observability
      - Existing “skills” (Slack post, Notion page create/update, etc.).

---

## 3. Sprint Plan Overview

This plan is organised into **4 sprints**, each approximately 1–2 weeks depending on team size:

1. **Sprint 1 – Foundations & Contracts**
2. **Sprint 2 – Flow 1: New Meta Campaign (Template‑First MVP)**
3. **Sprint 3 – Flow 2: Regenerate Underperformer + Routing & Cost Policies**
4. **Sprint 4 – Flow 3: Human Review via Composio + Hardening & Rollback**

Each sprint explicitly references and implements parts of the three flow specs.

---

## 4. Sprint 1 – Foundations & Contracts

### 4.1 Objectives

- Define and implement the **API contracts** between Jigi and the Creative Router.
- Set up the new microservice, with basic infrastructure, configs, and health endpoints.
- Establish **provider abstraction interfaces** and stubs for MCP tooling (no real calls yet).

### 4.2 Deliverables

- **Service scaffold**:
  - New repo or directory for `creative-router` with:
    - HTTP server
    - Health check endpoint (`/health`)
    - Basic logging and configuration system.
- **Public API contracts** (aligned with flow specs):
  - Request/response schemas for:
    - `POST /generate-creatives` (Flow 1)
    - `POST /regenerate-creatives` (Flow 2)
    - `POST /send-for-review` (Flow 3)
    - `GET /jobs/{id}` (if async).
- **Integration contract with Jigi**:
  - Shared types or OpenAPI spec consumed by Jigi backend.
  - Clear error format (`error_code`, `message`, `details`).
- **Provider interface definitions**:
  - Abstract interfaces for:
    - `CreativeProvider` (Canva/Adobe/Meta generators).
    - `ValidationProvider` (Meta MCP for asset checks).
    - `ReviewWorkflowProvider` (Composio‑backed).
  - In‑memory/mock implementations for local testing.

### 4.3 Key Tasks

- **Design API payloads using Flow 1–3 specs**:
  - Map sections of:
    - `01-new-meta-campaign.md` → `generate-creatives` fields.
    - `02-regenerate-underperformer.md` → `regenerate-creatives` fields.
    - `03-human-review-with-composio.md` → `send-for-review` fields.
- **Define minimal persistence model**:
  - Entities:
    - `CreativeJob` (status, type, request snapshot).
    - `CreativeVariant` (provider, template, URLs, placements, status).
    - `CreativeLineage` (links originals to replacements).
- **Add feature flag point to Jigi**:
  - Jigi backend configuration for:
    - Enabling/disabling creative router calls per environment.
    - Fallback behaviour if router is unavailable.
- **Prerequisites & environment setup**:
   - Create or confirm:
     - Composio account/workspace and MCP Gateway access (even if not fully used until Sprint 4).
     - Developer accounts for Canva, Meta, and Adobe (or chosen equivalents) and access to their MCP endpoints.
     - Test/staging Meta ad account and app configured for MCP usage.
   - Decide and document secrets management strategy (e.g. env vars + secret manager) for all MCP API keys and Jigi→Router shared secrets.
- **Testing (Sprint 1)**:
   - Unit tests for:
     - Request/response validation and error formatting in the API layer.
     - Provider interface mocks (Canva/Meta/Adobe/Composio) to validate call shapes.
     - Minimal persistence layer (creating/updating `CreativeJob` and `CreativeVariant` records).
   - Optional contract tests between Jigi and Creative Router using the shared OpenAPI spec.

### 4.4 Jigi Integration Points (Sprint 1)

- Jigi does not yet see real creatives, but:
  - Can hit Creative Router endpoints in **staging**.
  - Can log and observe mock responses.
  - Can toggle the `creative_router.enabled` flag safely.

---

## 5. Sprint 2 – Flow 1: New Meta Campaign (Template‑First MVP)

### 5.1 Objectives

- Implement **Flow 1** (`01-new-meta-campaign.md`) end‑to‑end using:
  - Canva MCP (or chosen template‑based MCP provider) for creative generation.
  - Optional Meta MCP validation for basic spec checking.
- Expose a fully working `POST /generate-creatives` for Meta Feed campaigns.

### 5.2 Deliverables

- **Routing Engine v1**:
  - Simple rules:
    - If `phase = test_and_learn` and `cost_profile = template_only`, then:
      - Use Canva MCP as primary generator.
      - Avoid paid generative image providers.
    - Target variant count per placement (configurable).
- **Canva MCP adapter**:
  - Operations:
    - Template search (by channel, placement, layout requirements).
    - Template instantiation (fill logo, colors, copy, CTA).
    - Export/render creatives and return asset URLs.
- **Meta MCP adapter (v1)**:
  - Operations:
    - Asset validation (dimensions, formats, sizes).
    - Optional preview rendering (mock ad previews).
- **End‑to‑end job handling**:
  - Create `CreativeJob` records for each request.
  - Store `CreativeVariant` metadata with provider/template IDs.

### 5.3 Key Tasks

- **Implement Flow 1 steps** as described in `01-new-meta-campaign.md`:
  - From Jigi request:
    - Normalise to internal `GenerateCreativesRequest`.
    - Route to Canva MCP.
    - Generate multi‑variant creatives for specified placements.
    - Optionally validate via Meta MCP.
    - Return results to Jigi with creative IDs, URLs, and placements.
- **Add basic error handling paths**:
  - No templates found.
  - MCP provider unavailable.
  - Invalid brand profile data.
- **Connect Jigi UI to real router** (staging):
  - New pipeline in Jigi to:
    - Trigger `generate-creatives` when a campaign is created or explicitly requested.
    - Display resulting variant gallery in the Jigi UI.
- **Prerequisites & environment setup**:
   - Configure Canva MCP credentials in staging:
     - API keys, project IDs, and any template libraries or folders used for ads.
   - Configure Meta MCP in a sandbox/test environment:
     - Link to test ad account and ensure permission scopes support asset validation and previews.
   - Store all credentials in the agreed secrets management system and wire them into the Creative Router deployment manifests for non‑prod first.
- **Testing (Sprint 2)**:
   - Unit tests for:
     - Routing Engine v1 decisions based on `phase` and `cost_profile`.
     - Canva MCP adapter behaviour, including template search and instantiation error paths.
     - Meta MCP adapter basic validation logic (with mocked responses).
   - Integration tests (staging or mocked) that:
     - Exercise `POST /generate-creatives` end‑to‑end for a sample Jigi campaign.
     - Verify that `CreativeJob` and `CreativeVariant` records are created and returned correctly.

### 5.4 Jigi Integration Points (Sprint 2)

- Jigi:
  - Shows a “Generate Creatives (Beta)” action for supported Meta campaigns.
  - Receives real creative variants with links/metadata.
  - Records the job ID and variant IDs for later regeneration and review flows.

---

## 6. Sprint 3 – Flow 2: Regenerate Underperformer + Routing & Cost Policies

### 6.1 Objectives

- Implement **Flow 2** (`02-regenerate-underperformer.md`) so that underperforming creatives can be regenerated in a cost‑aware way.
- Introduce **routing and cost policy configuration** beyond simple template‑only logic.

### 6.2 Deliverables

- **Regeneration support**:
  - `POST /regenerate-creatives` endpoint wired to:
    - Fetch lineage and original creative parameters.
    - Generate new template‑based variants using the same provider/template where possible.
    - Optionally create a limited number of “premium” variants via Adobe MCP (if configured).
- **Cost & policy configuration**:
  - YAML/JSON or DB‑backed configs specifying:
    - Max regenerated variants per creative.
    - Max premium variants per creative and per campaign.
    - Daily or per‑org quotas for creative generation.
- **Adobe MCP adapter (v1)**:
  - Operations:
    - Instantiate more advanced templates.
    - Generate 1–2 higher‑fidelity variants per regeneration, within cost limits.

### 6.3 Key Tasks

- **Implement Flow 2 steps** from `02-regenerate-underperformer.md`:
  - Consume performance signals from Jigi:
    - Jigi supplies original creative ID + performance summary.
  - Look up original creative lineage in the router’s store.
  - Regenerate N variants via the original provider (e.g. Canva MCP).
  - Optionally generate a single premium variant via Adobe MCP when allowed.
  - Return new variants tagged as replacements for the original.
- **Define and enforce cost rules**:
  - Middleware or routing logic that checks:
    - Current usage vs. quotas.
    - Whether premium paths are allowed for the campaign/org.
  - Return clear “cost limit reached” errors when hard caps are exceeded.
- **Extend Jigi support**:
  - Jigi analytics job flags underperformers and calls `regenerate-creatives`.
  - Jigi UI presents regenerated variants grouped under the original creative.
- **Prerequisites & environment setup**:
   - Ensure Adobe developer account and MCP access are fully configured for staging:
     - Test workspace, API keys, and any required project configuration.
   - Define location and ownership of routing/cost policy configuration (e.g. repo YAML vs. DB table).
   - Confirm how Jigi will supply performance metrics (fields, frequency) into `regenerate-creatives` requests.
- **Testing (Sprint 3)**:
   - Unit tests for:
     - Regeneration logic (correctly reusing original provider/template and parameters).
     - Lineage updates (linking new variants back to originals).
     - Cost and quota enforcement (including “cost limit reached” scenarios).
     - Adobe MCP adapter behaviour for advanced template instantiation (mocked).
   - Scenario tests that:
     - Start from a previously generated creative, simulate poor performance, and validate that the router returns replacement variants under configured quotas.

### 6.4 Jigi Integration Points (Sprint 3)

- Jigi:
  - Has a background or on‑demand process to identify underperforming creatives.
  - Calls the new regeneration endpoint to request replacements.
  - Updates UI to:
    - Mark originals as “Underperforming”.
    - Show replacement candidates with clear lineage.

---

## 7. Sprint 4 – Flow 3: Human Review via Composio + Hardening & Rollback

### 7.1 Objectives

- Implement **Flow 3** (`03-human-review-with-composio.md`) using Composio MCP for:
  - Slack‑based review threads.
  - Notion‑based logging of review decisions.
- Add **hardening**, observability, and a clean **rollback path** for the microservice.

### 7.2 Deliverables

- **Composio MCP integration**:
  - Review workflow provider implementation that:
    - Posts creative review summaries to Slack via Composio skills.
    - Creates/updates Notion pages for review logs.
    - Collects feedback (reactions/comments) from Slack via Composio and converts them to statuses.
- **`POST /send-for-review` endpoint**:
  - Accepts:
    - Campaign ID, creative IDs, review instructions.
    - Target Slack channel, Notion database (or uses org defaults).
  - Initiates the Composio‑driven review workflow.
- **Status updates & polling**:
  - `CreativeVariant` review statuses: Pending, Approved, Rejected, Needs Iteration, Mixed Feedback.
  - Jigi can poll for updated statuses or receive webhook updates from the router.
- **Hardening & rollback features**:
  - Feature flags at router level:
    - Enable/disable specific providers (Canva, Meta, Adobe, Composio).
    - Enable/disable specific flows (generation, regeneration, review).
  - Clear operational runbooks for:
    - Turning off Creative Router from Jigi (single flag).
    - Failing fast when MCP providers are down.

### 7.3 Key Tasks

- **Implement Flow 3 steps** from `03-human-review-with-composio.md`:
  - Map creatives and campaigns into Slack‑friendly messages and Notion pages.
  - Call Composio skills to post review threads and log records.
  - Periodically or on demand, call Composio to retrieve Slack reactions/comments.
  - Translate these into internal statuses and update Notion accordingly.
- **Observability & tool‑level tracing**:
  - Structured logs tagging:
    - Provider, tool, operation (e.g. `canva.search_templates`, `composio.slack.post_message`).
  - Basic metrics:
    - Number of creatives generated per provider.
    - Error rates per provider/operation.
    - Latency per call.
- **Rollback & safety design**:
  - Confirm that:
    - Turning off `creative_router.enabled` in Jigi cleanly bypasses all calls.
    - Orchestrator failures are surfaced as non‑fatal errors with clear messages.
    - Data owned by the router (jobs, variants, review states) is isolated so that the microservice can be disabled without schema migrations in Jigi.
 - **Prerequisites & environment setup**:
   - Configure Composio for the target orgs/environments:
     - Composio workspace/project with MCP Gateway enabled.
     - Connected Slack workspace with at least one review channel (e.g. `#creative-review`).
     - Connected Notion workspace with a database for creative review logs.
   - Store Composio API keys and any MCP URLs in the same secrets system used for other providers.
 - **Testing (Sprint 4)**:
   - Unit tests for:
     - ReviewWorkflowProvider logic that maps creatives/campaigns into Slack/Notion payloads.
     - Mapping of Slack reactions/comments into internal review statuses.
     - Error handling paths for Composio (e.g. provider unavailable, auth failure).
   - Integration or sandbox tests that:
     - Send a small creative batch for review and confirm Slack message + Notion record creation via Composio.
     - Simulate reactions in Slack and verify that the router updates review statuses visible to Jigi.

### 7.4 Jigi Integration Points (Sprint 4)

- Jigi:
  - Can send creatives for review and surface statuses (Approved/Rejected/etc.).
  - Links to Slack threads and Notion pages from the Jigi UI.
  - Can toggle router usage and per‑flow usage via configuration.

---

## 8. Post‑MVP Extensions (Beyond This Plan)

- **Performance‑aware routing**:
  - Use historical CTR/CPA data to bias template selection and provider choice.
- **Richer channel coverage**:
  - Extend beyond Meta Feed to Stories, Reels, other networks (Google Display, TikTok, etc.).
- **Deeper Adobe/Meta integrations**:
  - Use Adobe Firefly and Meta creative enhancements carefully under explicit cost tiers.
- **A/B testing automation**:
  - Automatic selection and rotation of variants based on performance feedback loops.

