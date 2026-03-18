# Ad Creation for MVP — Implementation Plan

**Version:** 1.0  
**Date:** March 2026  
**Scope:** Bolt-on microservice for ad activation and performance feedback (non-destructive, rollback-safe)

---

## 1. Purpose and priorities

| Priority | Focus | Description |
|----------|--------|-------------|
| **P0** | **Ad creation layer** | Turn approved Jigi creatives (concept + copy + image) into live ads on a chosen platform (Meta first). |
| P1 | Performance feedback loop | Pull metrics (impressions, clicks, spend, CTR, ROAS) and surface them in Jigi for learning and nudges. |
| P2 | Orchestration and polish | Optional Canva/Composio integration; lightweight orchestrator; audit and rollback safety. |

All work is additive: no changes to existing generation, review, or approval flows. Activation is feature-flagged and can be turned off for instant rollback.

---

## 2. Principles

- **Non-destructive:** New service and new routes only; no mandatory schema changes to existing Jigi tables.
- **Bolt-on:** Jigi app calls the activation service only when `AD_ACTIVATION_MODE=on` (or `shadow`).
- **Idempotent:** All create/sync operations require `Idempotency-Key`; repeat requests are safe.
- **Provider-agnostic:** Contract uses `platform` enum and normalized payloads so backend can switch Meta MCP / Composio / direct API without app changes.
- **Minimal contract:** Only the endpoints and payloads below are required for MVP.

---

## 3. Minimal API contract (recap)

### 3.1 Activation (ad creation)

**POST /v1/activations**

- **Request:** `jigi_campaign_id`, `organisation_id`, `brand_id`, `platform` (`meta`), `objective`, `budget`, `schedule`, `targeting`, `creative` (asset_url, headline, primary_text, cta, destination_url), `mode` (`dry_run` \| `publish`).
- **Headers:** `Authorization: Bearer <service-token>`, `Idempotency-Key: <uuid>`.
- **Response:** `activation_id`, `status` (`queued` \| `running` \| `live` \| `paused` \| `failed` \| `partial`), `platform`, `external_refs` (campaign_id, ad_set_id, creative_id, ad_id).

### 3.2 Activation status

**GET /v1/activations/{activation_id}**

- **Response:** Same as above plus `errors[]` when status is `failed` or `partial`.

### 3.3 Insights pull (trigger)

**POST /v1/insights/pull**

- **Request:** `platform`, `jigi_campaign_id`, `range` (e.g. `last_7d`), `granularity`.
- **Response:** `sync_id`, `status` (`queued`).

### 3.4 Insights read (feedback loop)

**GET /v1/insights/{jigi_campaign_id}**

- **Response:** `jigi_campaign_id`, `platform`, `range`, `metrics` (impressions, clicks, spend, ctr, cpc, conversions, roas), `updated_at`.

### 3.5 Optional webhook

**POST /v1/webhooks/provider**

- Receiver for provider callbacks (delivery/review status). Can be added in a later sprint.

---

## 4. Sprint breakdown

### Sprint 1 — Ad activation service foundation and Meta ad creation (P0)

**Goal:** Stand up the bolt-on service and implement the full ad-creation path for Meta so that an approved Jigi creative can be turned into a live (or dry-run) ad.

**Duration:** 1–2 weeks (recommended 2 if integrating Meta MCP/Composio for the first time).

**Deliverables:**

1. **Service scaffold**
   - New repo or subfolder `jigi-activation-service` (or equivalent) with Node/TypeScript.
   - No dependency on Jigi app codebase; contract-only integration via HTTP.
   - Env: `AD_ACTIVATION_MODE`, `ACTIVATION_SERVICE_URL`, `ACTIVATION_SERVICE_TOKEN`, `META_*` or `COMPOSIO_*` (or Meta MCP endpoint).

2. **Contract implementation**
   - `POST /v1/activations`: accept payload, validate, enforce `Idempotency-Key`, return `activation_id` and `status: queued`.
   - `GET /v1/activations/{activation_id}`: return status and `external_refs` when available.
   - Persist activations in a minimal store (e.g. SQLite/Postgres table or small Supabase table) keyed by `activation_id` and idempotency key.

3. **Meta ad creation (core path)**
   - For `platform === 'meta'` and `mode === 'publish'` (or `dry_run` with no actual spend):
     - Create campaign (if not reusing existing).
     - Create ad set (targeting, budget, schedule).
     - Create ad creative (image URL from `creative.asset_url`, copy from headline/primary_text, CTA, destination URL).
     - Create ad linking creative to ad set.
   - Use either:
     - **Option A:** Meta MCP server (e.g. [brijr/meta-mcp](https://github.com/brijr/meta-mcp)) as subprocess or HTTP, or  
     - **Option B:** Composio Metaads toolkit ([Composio Metaads](https://composio.dev/toolkits/metaads)) for managed auth and tool calls.
   - Map provider errors to `status: failed` or `partial` and persist in `external_refs` and `errors[]`.

4. **Idempotency and safety**
   - Idempotency-Key stored and honoured; duplicate requests return same `activation_id` and current status.
   - `mode === 'dry_run'`: perform all validations and optionally create objects in test mode or skip spend; report success/failure without charging.

5. **Docs and runbook**
   - README: how to run the service, env vars, and how to call `POST /v1/activations` and `GET /v1/activations/{id}`.
   - One-page runbook: how to turn activation off (feature flag) and roll back.

**Exit criteria:** From Jigi (or Postman), one approved creative can be submitted via `POST /v1/activations` and result in a live Meta ad (or a successful dry run) with status visible via `GET /v1/activations/{activation_id}`.

---

### Sprint 2 — Jigi integration and performance feedback loop (P1)

**Goal:** Jigi app can trigger ad creation and display activation status and performance metrics, without changing existing generation/approval flows.

**Duration:** 1–2 weeks.

**Deliverables:**

1. **Jigi → Activation wiring (feature-flagged)**
   - In Jigi app (e.g. campaign detail or approved-asset view), add “Create ad” (or “Publish to Meta”) only when `AD_ACTIVATION_MODE === 'on'` or `'shadow'`.
   - Call `POST /v1/activations` with payload built from:
     - Approved asset (image URL from Supabase Storage or current CDN).
     - Copy from approved concept/copy (headline, primary text, CTA).
     - Campaign/brand/organisation IDs and targeting/budget from campaign or defaults.
   - Send `Idempotency-Key` (e.g. derived from `jigi_campaign_id` + approved asset id + timestamp or version).
   - Store `activation_id` on the campaign or in a new lightweight table (e.g. `ad_activations`: `jigi_campaign_id`, `activation_id`, `platform`, `status`, `external_refs`).

2. **Activation status in Jigi**
   - Poll or refresh `GET /v1/activations/{activation_id}` and show status (queued / running / live / failed) and, if failed, a short error summary.
   - Optional: webhook from activation service to Jigi to update status in near real-time (can be deferred).

3. **Insights pull and storage**
   - `POST /v1/insights/pull`: implemented in activation service; for Meta, call provider insights API (or MCP/Composio tool), store normalized metrics by `jigi_campaign_id` and range.
   - `GET /v1/insights/{jigi_campaign_id}`: return latest metrics (impressions, clicks, spend, ctr, cpc, conversions, roas) and `updated_at`.

4. **Performance feedback in Jigi**
   - In campaign detail or dashboard, show “Ad performance” (or “Meta performance”) when an activation exists for that campaign: call `GET /v1/insights/{jigi_campaign_id}` and display metrics.
   - Optional: simple nudge copy (“This creative has X impressions, Y clicks; consider pausing or scaling.”) reusing existing nudge patterns where applicable.

5. **Rollback and operations**
   - Set `AD_ACTIVATION_MODE=off` in Jigi to hide “Create ad” and stop calling the activation service; no code removal required.
   - Document rollback and any env vars that must be reverted.

**Exit criteria:** From Jigi, user can publish an approved creative to Meta, see activation status, and see performance metrics for that campaign in the app.

---

### Sprint 3 — Orchestration, optional Canva/Composio, and hardening (P2)

**Goal:** Optional enrichment (e.g. Canva MCP for templating), clearer orchestration, and production hardening without blocking P0/P1.

**Duration:** 1 week (can be split or deferred).

**Deliverables:**

1. **Lightweight orchestrator (optional)**
   - Thin “orchestrator” layer inside the activation service that:
     - Validates and normalizes incoming payloads.
     - Applies policy (e.g. budget caps, allowed platforms).
     - Logs audit events (who requested, when, idempotency key, result).
     - Delegates to Meta (and later other providers) without changing the external contract.

2. **Optional Canva MCP integration**
   - If useful for “creative production” (e.g. autofill template, export final image), add an optional path: Jigi approved concept → Canva MCP (create/autofill/export) → use exported asset URL in `creative.asset_url` for `POST /v1/activations`.
   - Feature-flagged so activation works with or without Canva.

3. **Composio (if not used in Sprint 1)**
   - If Sprint 1 used raw Meta MCP, evaluate switching to Composio Metaads for managed OAuth and tool calls; document migration path.
   - If already on Composio, add any missing tools (e.g. upload ad image) and error handling.

4. **Hardening**
   - Rate limiting and timeouts on activation and insights endpoints.
   - Basic health check endpoint (e.g. `GET /health`) for the activation service.
   - Logging and minimal observability (e.g. request id, activation_id, status, errors) for support and rollback.

**Exit criteria:** Activation and insights remain stable; optional Canva path works if enabled; runbook and rollback steps are clear.

---

## 5. Dependencies and order

- **Sprint 1** must be done first (service + Meta ad creation).
- **Sprint 2** depends on Sprint 1 (Jigi calls the live contract).
- **Sprint 3** can run in parallel with Sprint 2 or after; it does not block “ad creation + feedback loop” MVP.

---

## 6. Rollback

- **Immediate:** Set `AD_ACTIVATION_MODE=off` in Jigi; no more calls to the activation service; “Create ad” hidden.
- **Service-side:** Stop or scale down the activation service; Jigi will receive errors and can show “Ad activation temporarily unavailable.”
- **Data:** Activation service’s own persistence (activation_id, external_refs) can be kept for audit; no required changes to Jigi core DB for rollback.

---

## 7. File and folder layout

- **docs/ad-creation-for-mvp/** — This folder.
  - **02-ads-activation-implementation-plan.md** — This file.
- **jigi-activation-service/** (or equivalent) — New codebase for the bolt-on service; location TBD (same repo subfolder or separate repo).

---

## 8. Naming and conventions

- Use existing Jigi identifiers: `jigi_campaign_id`, `organisation_id`, `brand_id` as in the contract.
- Enums: `platform` (`meta` \| `google` \| `linkedin` \| `tiktok`), `status` (queued \| running \| live \| paused \| failed \| partial), `mode` (dry_run \| publish).
- API version prefix: `/v1/` for all activation and insights endpoints.

This plan prioritises **ad creation** as the main deliverable (Sprint 1), with **performance feedback** and Jigi integration in Sprint 2, and optional orchestration/Canva/Composio in Sprint 3, all in a non-destructive, rollback-safe way.
