## Creative Router – Sprint 1 Setup

### External prerequisites

- **Composio**
  - Workspace/project created for Jigi.
  - MCP Gateway enabled for use in later sprints.
- **Canva**
  - Developer account and app/project with access to Canva MCP once real providers are wired.
- **Meta**
  - Developer account and app configured for creative tooling.
  - Test/staging ad account available for Meta MCP validation and previews.
- **Adobe**
  - Developer account and workspace for Adobe MCP.

Sprint 1 uses only **mock providers** – no real MCP calls are made – but these accounts should be provisioned so that credentials can be plugged in during Sprints 2–4.

### Environment variables and secrets

All secrets are intended to be injected via a secret manager or `.env` files in non‑production environments.

Creative Router service:

- `PORT` – port for the HTTP server (default `4000`).
- **Sprint 2 – Canva MCP** (optional; when unset, the router falls back to mock generation):
  - `CANVA_MCP_BASE_URL` – base URL of the Canva MCP-compatible service (e.g. `https://canva-mcp.example.com`).
  - `CANVA_MCP_API_KEY` – API key or bearer token for the Canva MCP service.
  - The service is expected to expose:
    - `POST {baseUrl}/templates/search` – body: `{ channel, placements }`, response: `{ templateIds: string[] }`.
    - `POST {baseUrl}/designs/create` – body: `{ templateId, jobId, brandProfileId, copy, placement, variantIndex }`, response: `{ designId, assetUrl }`.
- **Sprint 2 – Meta MCP** (optional; when unset, validation is skipped or mock):
  - `META_MCP_BASE_URL` – base URL of the Meta MCP validation service.
  - `META_MCP_API_KEY` – API key or bearer token.
  - The service is expected to expose:
    - `POST {baseUrl}/creatives/validate` – body: `{ assets: [{ url, placement, aspectRatio? }] }`, response: `{ results: [{ valid, issues }] }`.
- Other MCP keys (for later sprints):
  - `ADOBE_MCP_KEY`
  - `COMPOSIO_API_KEY`

Jigi app (server/API layer):

- `CREATIVE_ROUTER_ENABLED` – boolean flag to enable calls to this service.
- `CREATIVE_ROUTER_BASE_URL` – base URL for the Creative Router (default `http://localhost:4000`).

### Running with real Meta validation

To use **real** creative validation instead of the mock (always-valid) behaviour:

1. **Run the meta-validation-proxy** (sibling directory at repo root):
   - `cd meta-validation-proxy && pnpm install && pnpm dev`
   - It listens on port `3002` by default (`PORT` env to override).

2. **Configure the Creative Router** with the proxy URL and your Meta token:
   - Copy `creative-router/.env.example` to `creative-router/.env`.
   - Set `META_MCP_BASE_URL=http://localhost:3002` and `META_MCP_API_KEY=<your-meta-access-token>` (get the token from [Meta for Developers](https://developers.facebook.com/) / Graph API Explorer with Marketing API permissions).
   - Restart the Creative Router so it picks up the new env.

3. **Optional – end-to-end from Jigi:** In `uiux/jigi-app/.env.local` set `CREATIVE_ROUTER_ENABLED=true` and `CREATIVE_ROUTER_BASE_URL=http://localhost:4000`, then use “Generate Creatives (Beta)” to smoke-test; validation will go through the proxy.

If you unset or clear `META_MCP_BASE_URL` and `META_MCP_API_KEY` and restart the router, it falls back to mock validation (all assets reported valid).

