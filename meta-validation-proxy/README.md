# Meta Validation Proxy

Thin proxy used by the Creative Router to validate creative assets (images) against Meta Feed–style specs: dimensions (min 600×600), format (JPEG/PNG/WebP), aspect ratio (1:1 to 1.91:1), and optional size limit (4MB). The router sends the Meta token in the request; this service does not store it.

## Run

```bash
pnpm install
pnpm dev
```

- **Health:** `GET /health` → `{ "status": "ok" }`
- **Validate:** `POST /creatives/validate` with `Authorization: Bearer <token>` and body below.

## Env

| Variable | Description |
|----------|-------------|
| `PORT`   | Server port (default `3002`) |

The Creative Router sets `META_MCP_BASE_URL` to this service (e.g. `http://localhost:3002`) and `META_MCP_API_KEY` to the Meta access token; the router sends that token on each validate request.

## Contract

**Request:** `POST /creatives/validate`

- Headers: `Content-Type: application/json`, `Authorization: Bearer <token>`
- Body: `{ "assets": [{ "url": string, "placement": string, "aspectRatio"?: string }] }`

**Response:** `200` with `{ "results": [{ "valid": boolean, "issues": string[] }] }` (one entry per asset). `400` if body is invalid; `401` if `Authorization` is missing.
