## CreativeGen MVP – Sprint Progress Log

### Overview

This document tracks implementation progress for the Creative Router microservice sprints defined in `00-creativegen-mcp-01.md`.

---

### Sprint 1 – Creative Router Foundations & Contracts

**Status:** Completed  
**Scope reference:** See `creative-router-sprint-1` plan and `00-creativegen-mcp-01.md` section “4. Sprint 1 – Foundations & Contracts”.

- **Service scaffold and configuration**
  - `creative-router` service created at project root.
  - Fastify HTTP server with `/health` endpoint in `creative-router/src/index.ts`.
  - Centralised TypeScript config in `creative-router/tsconfig.json`; basic logging via Fastify’s logger.

- **Public API design (Jigi ↔ Creative Router)**
  - OpenAPI spec at `creative-router/openapi.yaml` covering:
    - `GET /health`
    - `POST /generate-creatives`
    - `POST /regenerate-creatives`
    - `POST /send-for-review`
    - `GET /jobs/{id}`
  - TypeScript DTOs in `creative-router/src/types.ts`.
  - Route handlers implemented in `creative-router/src/routes.ts` with:
    - Request validation for required fields.
    - Structured error responses for `400` and `404`.

- **Persistence model (Jobs, Variants, Lineage)**
  - Models defined in `creative-router/src/models.ts` for:
    - `CreativeJob`
    - `CreativeVariant`
    - `CreativeLineage`
  - In‑memory repository in `creative-router/src/store/memoryStore.ts`:
    - Job creation, retrieval, and status updates.
    - Variant creation and lineage recording.
  - `GET /jobs/{id}` wired to the store to return typed `JobStatusResponse`.

- **Provider abstraction interfaces and mocks**
  - Creative generation:
    - `CreativeProvider` + `MockCreativeProvider` in `creative-router/src/providers/creativeProvider.ts`.
  - Validation:
    - `ValidationProvider` + `MockValidationProvider` in `creative-router/src/providers/validationProvider.ts`.
  - Review workflow:
    - `ReviewWorkflowProvider` + `MockReviewWorkflowProvider` in `creative-router/src/providers/reviewWorkflowProvider.ts`.
  - `src/routes.ts` uses these mocks so that Sprint 1 exercises provider abstractions without real MCP calls.

- **Jigi integration contract and feature flagging**
  - Thin client for Jigi in `uiux/jigi-app/api/lib/creative-router-client.ts`:
    - Uses `CREATIVE_ROUTER_ENABLED` and `CREATIVE_ROUTER_BASE_URL` env vars.
    - Sends `POST /generate-creatives` requests when enabled.
  - No behavioural change when the flag is `false`; router is opt‑in.

- **Prerequisites and secrets strategy**
  - `creative-router/README.md` documents:
    - Required external accounts: Composio (MCP Gateway), Canva, Meta, Adobe.
    - Environment variable naming conventions for future MCP keys and router integration.
    - Jigi‑side flags and base URL env vars.

- **Testing setup (unit + minimal integration)**
  - Vitest configured via `creative-router/package.json` (`pnpm test`).
  - Tests added:
    - `tests/routes.test.ts` – `/health` and `POST /generate-creatives` (happy + error paths).
    - `tests/store.test.ts` – job creation/retrieval and status updates for the in‑memory store.
  - All tests currently passing.

---

### Sprint 2 – Flow 1: New Meta Campaign (Template‑First MVP)

**Status:** Completed  
**Planned scope:** See `00-creativegen-mcp-01.md` section “5. Sprint 2 – Flow 1: New Meta Campaign (Template‑First MVP)”.

- **Routing Engine v1**
  - `creative-router/src/routing/engine.ts`: chooses primary provider (canva vs mock) and whether to use Meta validation based on `channel`, `phase`, and `costProfile`. Meta + test_and_learn + template_only => Canva + Meta validation; otherwise mock.
- **Canva MCP adapter**
  - `creative-router/src/providers/canvaMcpAdapter.ts`: `CanvaMcpAdapter` implements `CreativeProvider` with optional `CanvaMcpClient` (null when env not set). When configured, calls `searchTemplates` and `createDesign`; when not configured, route layer uses mock. `createCanvaMcpAdapterFromEnv()` reads `CANVA_MCP_BASE_URL` and `CANVA_MCP_API_KEY`.
- **Meta MCP adapter**
  - `creative-router/src/providers/metaMcpAdapter.ts`: `MetaMcpAdapter` implements `ValidationProvider`; when client is set, calls `validateAssets`; when null, returns valid. `createMetaMcpAdapterFromEnv()` reads `META_MCP_BASE_URL` and `META_MCP_API_KEY`.
- **Generate-creatives flow**
  - `POST /generate-creatives` uses routing decision, then Canva (or mock) for generation and Meta (or mock) for validation. Persists `CreativeVariant` records; returns 202 with `jobId` and `variants` array. `GET /jobs/:id` includes `resultSummary.variantCount` and `variantIds`.
- **Error handling**
  - `creative-router/src/errors.ts`: `NO_TEMPLATES_FOUND`, `PROVIDER_UNAVAILABLE`, `BRAND_PROFILE_INVALID`. Routes return 400 for bad request/brand/templates and 502 for provider failures.
- **Jigi integration**
  - `uiux/jigi-app/api/lib/creative-router-client.ts`: extended with typed payload, `GenerateCreativesResult`, `mapCreativeRouterErrorToMessage`, `isCreativeRouterEnabled`.
  - `uiux/jigi-app/api/creative-router/generate.ts`: new API route that builds `GenerateCreativesPayload` from campaign + brand, calls `callGenerateCreatives`, returns 202 with jobId/variants or mapped errors.
  - `uiux/jigi-app/src/lib/api-client.ts`: `generateCreativesViaRouter(campaignId)`.
  - `uiux/jigi-app/src/pages/CampaignDetail.tsx`: "Generate Creatives (Beta)" button; on success shows a gallery of variants (template creatives) with thumbnails and provider/placement metadata.
- **Prerequisites and env**
  - `creative-router/README.md` updated with Sprint 2 env vars and expected Canva/Meta MCP endpoint shapes.
  - Step-by-step env setup: see **`env-setup-guide.md`** in this folder for how to obtain and set Canva, Meta, Jigi, and other variables.
- **Testing**
  - `tests/routing.test.ts`: routing decisions for phase, costProfile, experimentConfig.
  - `tests/canvaAdapter.test.ts`: isConfigured, generateFromRequest with mocked client, NO_TEMPLATES_FOUND when templateIds empty.
  - `tests/metaAdapter.test.ts`: isConfigured, validateVariants with null client and with mock client.
  - `tests/routes.test.ts`: extended to assert response includes `variants` array and BRAND_PROFILE_INVALID for empty brandProfileId.
  - All 19 tests passing.

- **Meta validation wiring (Option B – thin proxy)**
  - **Implemented:** Thin proxy at **`meta-validation-proxy/`** (repo root, sibling to `creative-router/`). It exposes `GET /health` and `POST /creatives/validate`; validates image URLs against Meta Feed–style specs (format JPEG/PNG/WebP, min 600×600, aspect ratio 1:1–1.91:1, max 4MB). Creative Router already reads `META_MCP_BASE_URL` and `META_MCP_API_KEY`; no router code changes.
  - **How to run:** (1) Start proxy: `cd meta-validation-proxy && pnpm dev` (port 3002). (2) Set Creative Router env: `META_MCP_BASE_URL=http://localhost:3002`, `META_MCP_API_KEY=<token>`. (3) Restart Creative Router. (4) Optionally set Jigi env (`CREATIVE_ROUTER_ENABLED=true`, `CREATIVE_ROUTER_BASE_URL=http://localhost:4000`) and smoke-test “Generate Creatives (Beta)”.
  - **Rollback:** To revert to mock validation (always valid), unset or clear `META_MCP_BASE_URL` and `META_MCP_API_KEY` in the Creative Router env and restart the router.

---

### Sprint 3 – Flow 2: Regenerate Underperformer + Routing & Cost Policies

**Status:** Not started  
**Planned scope:** See `00-creativegen-mcp-01.md` section “6. Sprint 3 – Flow 2: Regenerate Underperformer + Routing & Cost Policies”.

Progress will be logged here once Sprint 3 work begins.

---

### Sprint 4 – Flow 3: Human Review via Composio + Hardening & Rollback

**Status:** Not started  
**Planned scope:** See `00-creativegen-mcp-01.md` section “7. Sprint 4 – Flow 3: Human Review via Composio + Hardening & Rollback”.

Progress will be logged here once Sprint 4 work begins.

---

### Troubleshooting: Generation Failing (Concept, Copy, Image)

**Symptom:** All generation (concept, copy, image, image prompt refinement) fails with generic errors.

**Cause:** The Jigi API routes (`/api/generate/text`, `/api/generate/image`, etc.) are served by Vercel's serverless runtime. When running `pnpm dev` (Vite only), the frontend proxies `/api` to `localhost:3000`, but nothing serves the API there.

**Fix:** Run `pnpm start` instead of `pnpm dev`. This runs `vercel dev`, which serves both the frontend and API on one port (typically 3000). See `env-setup-guide.md` section 2.

**If `vercel dev` fails** (e.g. `NO_RESPONSE_FROM_FUNCTION`, invalid token, or path-with-spaces issues): use the local API server instead. Run in **two terminals**:

1. Stop anything on port 3000 first: `lsof -ti :3000 | xargs kill`
2. `pnpm dev:api` – serves API on port 3000 (health, generate/text, generate/image, etc.)
3. `pnpm dev` – Vite frontend on 5173, proxies `/api` to localhost:3000

This bypasses Vercel dev entirely. Ensure `.env.local` is in the project root or `uiux/jigi-app`.

