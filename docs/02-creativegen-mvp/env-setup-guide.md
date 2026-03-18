# CreativeGen MVP – Environment Variables Setup Guide

This guide walks you through obtaining and configuring every environment variable used by the Creative Router and Jigi app for Sprints 1 and 2. You can run everything with **no** third-party keys (mocks only); set the optional keys when you want real Canva/Meta behaviour.

---

## 1. Creative Router service (local or deployed)

### 1.1 Required (Sprint 1 & 2)

| Variable   | Description | How to set |
|-----------|-------------|------------|
| `PORT`    | HTTP port the Creative Router listens on. | Optional. Default is `4000`. Set only if you need a different port (e.g. `PORT=4000` in `.env` or your process manager). |

No other env vars are **required**. With only `PORT` (or nothing), the router runs and uses **mock** providers for generation and validation.

### 1.2 Optional – Canva MCP (Sprint 2)

Used when you want real template-based creatives instead of mocks.

#### Where do I get the Canva API base URL?

**You don’t get it from the dashboard.** The Canva Connect API base URL is a **fixed, documented URL** — you copy it from the docs and set it in your env.

- **Standard (rest of world):**  
  `https://api.canva.com/rest`  
  (Canva docs: [Connect APIs](https://www.canva.dev/docs/connect/), [API requests and responses](https://www.canva.dev/docs/connect/api-requests-responses/). Endpoints live under this base, e.g. `https://api.canva.com/rest/v1/...`.)

- **China region:**  
  `https://api.canva.cn/rest`  
  (See [Quickstart](https://www.canva.dev/docs/connect/quickstart/) → “Step 5: Configure the env file” → `BASE_CANVA_CONNECT_API_URL` for China.)

So for most setups, set:

- `CANVA_MCP_BASE_URL=https://api.canva.com/rest`

**Important:** Our Creative Router expects a service that exposes `POST /templates/search` and `POST /designs/create`. Canva’s public API uses different paths and request shapes. So either:

- You run a **thin proxy** that implements those two routes and calls Canva’s real endpoints under the hood — then `CANVA_MCP_BASE_URL` is your proxy’s base URL (e.g. `http://localhost:3001`), or  
- You use an **existing Canva MCP gateway** (e.g. from Composio or self-hosted) that already speaks our contract — then `CANVA_MCP_BASE_URL` is that gateway’s URL.

If you call Canva’s API directly from the router (future work), you’d set `CANVA_MCP_BASE_URL=https://api.canva.com/rest` and the adapter would need to map our operations to Canva’s actual endpoints (e.g. under `/v1/`).

| Variable | Description | How to get it |
|----------|-------------|----------------|
| `CANVA_MCP_BASE_URL` | Base URL of a service that implements the Canva MCP-style API (templates/search, designs/create). | **Option A – Existing Canva MCP gateway:** Your gateway’s base URL (e.g. `https://canva-mcp.yourcompany.com`). **Option B – Canva Connect API (direct):** Use the fixed base URL `https://api.canva.com/rest` (see above). You still need a proxy or adapter that maps our `templates/search` and `designs/create` to Canva’s real paths. **Option C – Stub for dev:** A stub server’s URL (e.g. `http://localhost:3001`). |
| `CANVA_MCP_API_KEY`  | API key or bearer token for the Canva MCP service. | **From the Developer Portal:** [Canva for Developers](https://www.canva.com/developers/) → Your integration → Configuration → generate/copy the **Client secret** (and use OAuth to obtain an access token for API calls, or use the secret in server-to-server flows as documented by Canva). Store in `.env` or your secret manager; never commit. |

**Step-by-step (Canva for Developers – Option B):**

1. Go to [Canva for Developers](https://www.canva.com/developers/) and sign in.
2. Open [Your integrations](https://www.canva.com/developers/integrations) and create or select an integration.
3. Under **Configuration**, generate and save the **Client secret** (you’ll use this or a token derived from it as `CANVA_MCP_API_KEY`).
4. Set **API base URL** in your env to the fixed value: `CANVA_MCP_BASE_URL=https://api.canva.com/rest` (or your proxy’s URL if you built one that implements our two endpoints).
5. Our adapter expects `POST {baseUrl}/templates/search` and `POST {baseUrl}/designs/create`. If you’re calling Canva’s API directly, the adapter or a small proxy must map those to Canva’s actual Connect API endpoints.

### 1.3 Optional – Meta MCP (Sprint 2)

Used when you want real creative validation (and optional previews) instead of mock validation.

#### Meta app: use cases needed for MVP

For the Creative Router MVP (template-first creatives, validation, test-and-learn) you only need **Marketing API** access. Recommended:

| Use case | Keep for MVP? | Why |
|----------|----------------|-----|
| **Create & manage ads with Marketing API** | **Yes** | Required for programmatic creatives and validation. |
| **Measure ad performance data with Marketing API** | **Yes** | Needed for test-and-learn and optimization. |
| **Capture & manage ad leads with Marketing API** | Optional | Only if you run lead-gen campaigns in MVP. |
| **Create & manage app ads with Meta Ads Manager** | **No** | Does not include Marketing API; not needed for our programmatic flow. |
| **Access the Threads API** | **No** | Out of scope unless you add Threads creatives later. |
| **Advertise on your app with Meta Audience Network** | **No** | For monetizing your app with ads, not for creating campaign creatives. |
| **Manage messaging & content on Instagram** | Optional | Useful if creatives target Instagram Feed/Stories and you need Instagram API. |
| **Connect with customers through WhatsApp** | Optional | Only if you need WhatsApp ad placements or click-to-WhatsApp in MVP. |

**Minimum for MVP:** enable **Create & manage ads with Marketing API** and **Measure ad performance data with Marketing API**. You can remove the others for now and add them in a later phase if needed.

#### Meta app: App settings to change (Advanced)

**From your third screenshot (App settings > Advanced – first part):**

- **Upgrade API version**  
  Keep **Upgrade all calls** and **Upgrade calls for app roles** on the **latest stable version** shown in the dropdown (e.g. v25.0 or whatever Meta currently recommends). No change needed if you’re already on the latest.

- **App authentication**  
  For server-to-server only (no user OAuth): leave **Native or desktop app** **Off** and **Authorize callback URL** empty. If you later add Facebook Login or user-based tokens, set a callback URL and enable as needed.

- **App restrictions**  
  No change required for MVP. Adjust age/country/alcohol later if your creatives or audience require it.

**From your fourth screenshot (App settings > Advanced – Security & Advertising):**

- **Require app secret**  
  **Change to On.** Then any API calls using access tokens outside trusted contexts must include the app secret (or app secret proof). Your `creative-router` / backend should send the secret or token; this improves security.

- **Server IP allowlist**  
  Optional for MVP. When the Creative Router (or Jigi API) runs on a server with a **fixed public IP**, add that IP here so only your server can use the app secret. For local dev or dynamic IPs, leave blank.

- **Advertising accounts (0/100)**  
  **Must change.** Add the **Meta Ad Account ID(s)** you use for campaigns. Without this, the app cannot access those ad accounts for validation or publishing.  
  - Get the Ad Account ID from Meta Business Manager or Ads Manager (often in the URL or account settings).  
  - In the app: add each ID so the count increases (e.g. 1/100). You can add up to 100.

- **Domain manager**  
  No change for MVP. Add and verify your app’s domain only if you use Facebook Login, webhooks, or features that require domain verification.

- **Allow API Access to app settings**  
  Leave **Off** unless you need to change app settings via API.

| Variable | Description | How to get it |
|----------|-------------|----------------|
| `META_MCP_BASE_URL` | Base URL of a service that implements the Meta MCP-style validation API (creatives/validate). | **Option A – Use an existing Meta MCP gateway:** If you have a Meta MCP or “Marketing API” gateway that exposes a single `POST /creatives/validate` (or equivalent), use its base URL. **Option B – Meta Marketing API:** Use [Meta for Developers](https://developers.facebook.com/) and the Marketing API. You will need a small proxy that accepts our payload `{ assets: [{ url, placement, aspectRatio? }] }` and calls Meta’s creative validation/specs endpoints, then returns `{ results: [{ valid, issues }] }`. Set `META_MCP_BASE_URL` to that proxy. **Option C – Stub for dev:** Run a stub that returns `{ results: assets.map(() => ({ valid: true, issues: [] })) }`; set `META_MCP_BASE_URL` to the stub (e.g. `http://localhost:3002`). |
| `META_MCP_API_KEY`  | API key or bearer token for the Meta MCP / proxy service. | (A) From your MCP gateway; (B) Meta app access token (with `ads_management` or creative-related permissions); (C) any string for a local stub. |

**Step-by-step (Meta for Developers – Option B):**

1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Sign in and create or select an app.
3. Add the **Marketing API** product and configure permissions (e.g. `ads_management`, `ads_read`) for the app.
4. Generate a **User** or **System** access token with those permissions (for server-to-server, use a long-lived token or app token where applicable).
5. Build or use a small service that exposes `POST /creatives/validate` and, for each asset URL, uses Meta’s creative validation/specs (e.g. image dimensions, format) and returns `{ results: [{ valid, issues }] }`.
6. Set `META_MCP_BASE_URL` to that service’s URL and `META_MCP_API_KEY` to the Meta access token (or the proxy’s own auth token if the proxy stores the Meta token server-side).

#### Option B – Thin proxy (recommended for local dev)

A thin validation proxy is implemented in the repo at **`meta-validation-proxy/`** (sibling to `creative-router/`). It exposes `POST /creatives/validate`, fetches each asset URL, checks image dimensions/format/size against Meta-style specs, and returns `{ results: [{ valid, issues }] }`. No code changes are required in the Jigi app.

1. **Start the proxy:** `cd meta-validation-proxy && pnpm install && pnpm dev` (listens on port `3002` by default).
2. **Configure the Creative Router:** In `creative-router/.env` set `META_MCP_BASE_URL=http://localhost:3002` and `META_MCP_API_KEY=<your-meta-access-token>` (Meta token from Graph API Explorer or your Meta app).
3. **Restart the Creative Router** so it uses the proxy. The router sends the token in the `Authorization` header on each request; the proxy does not store it.
4. Optionally enable the Jigi app as in section 2 above and smoke-test “Generate Creatives (Beta)”.

### 1.4 Reserved for later sprints (Sprint 1 doc, not needed for Sprint 2)

| Variable | When used | Where to get it |
|----------|-----------|------------------|
| `ADOBE_MCP_KEY`   | Sprint 3 – Adobe MCP adapter. | [Adobe Developer Console](https://developer.adobe.com/): create a project, get client credentials and (if needed) MCP gateway key. |
| `COMPOSIO_API_KEY`| Sprint 4 – Composio MCP (Slack/Notion review). | [Composio](https://composio.dev/): sign up, create a project, copy API key from the dashboard. |

---

## 2. Jigi app (server/API layer)

For **end-to-end testing** of the Generate Creatives (Beta) flow, set the following in **`uiux/jigi-app/.env.local`** (create the file if it doesn’t exist):

- `CREATIVE_ROUTER_ENABLED=true`
- `CREATIVE_ROUTER_BASE_URL=http://localhost:4000`

These are used by the Jigi backend when calling the Creative Router (e.g. `api/creative-router/generate.ts` and `api/lib/creative-router-client.ts`).

| Variable | Description | How to set |
|----------|-------------|------------|
| `CREATIVE_ROUTER_ENABLED` | When `true`, Jigi calls the Creative Router for generate-creatives. When `false`, those calls are skipped (e.g. 503 from `/api/creative-router/generate`). | Set to `true` or `1` in staging/local when the Creative Router is running and you want to use it. Use `false` or omit in prod until you’re ready. In Jigi, env is loaded from `.env.local` (see `api/lib/env.ts`). |
| `CREATIVE_ROUTER_BASE_URL` | Base URL of the Creative Router (no trailing slash). | When running the router locally: `http://localhost:4000`. When deployed: your router’s public or internal URL (e.g. `https://creative-router.staging.yourcompany.com`). Default in code is `http://localhost:4000` if unset. |

**Step-by-step (Jigi):**

1. **Run Jigi with API:** Use `pnpm start` (runs `vercel dev`) so both the frontend and API routes (`/api/generate/text`, `/api/generate/image`, etc.) are served. Do **not** use `pnpm dev` alone—that runs only Vite and proxies `/api` to port 3000, which will fail if nothing is serving the API.
2. Ensure the Creative Router is running (e.g. `cd creative-router && pnpm dev` so it listens on `http://localhost:4000`).
3. In the Jigi app root (e.g. `uiux/jigi-app`), create or edit `.env.local`.
4. Add:
   - `CREATIVE_ROUTER_ENABLED=true`
   - `CREATIVE_ROUTER_BASE_URL=http://localhost:4000`
5. Restart the Jigi dev server / API so it picks up the new env. The “Generate Creatives (Beta)” flow will then call the router; without these, the API returns 503 for that endpoint.

---

## 3. Quick reference – where each variable is used

| Variable | Used by | Required? |
|----------|--------|-----------|
| `PORT` | Creative Router only | No (default 4000) |
| `CANVA_MCP_BASE_URL` | Creative Router | No (mock if unset) |
| `CANVA_MCP_API_KEY`  | Creative Router | No (mock if unset) |
| `META_MCP_BASE_URL`  | Creative Router | No (skip validation if unset) |
| `META_MCP_API_KEY`   | Creative Router | No |
| `CREATIVE_ROUTER_ENABLED` | Jigi API | No (default false) |
| `CREATIVE_ROUTER_BASE_URL` | Jigi API | No (default localhost:4000) |
| `ADOBE_MCP_KEY`      | Creative Router (Sprint 3) | No |
| `COMPOSIO_API_KEY`   | Creative Router (Sprint 4) | No |

---

## 4. Minimal setup to run end-to-end (no third-party keys)

1. **Creative Router:**  
   `cd creative-router && pnpm dev`  
   No env needed; uses port 4000 and mocks.

2. **Jigi:**  
   In `uiux/jigi-app/.env.local` set:
   - `CREATIVE_ROUTER_ENABLED=true`
   - `CREATIVE_ROUTER_BASE_URL=http://localhost:4000`

3. Run Jigi (`pnpm dev`), open a campaign, click **Generate Creatives (Beta)**. You should get mock variants back with no Canva or Meta credentials.
