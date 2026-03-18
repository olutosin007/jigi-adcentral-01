import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Minimal health check - no heavy deps. Use to verify API is reachable.
 * GET /api/health → 200
 */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
}

