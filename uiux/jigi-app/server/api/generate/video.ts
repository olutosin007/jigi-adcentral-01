import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getBooleanEnv } from '../lib/env.js'

/**
 * Video generation scaffold. Returns 501 while VIDEO_ENABLED is false (default).
 * No UI entry points until a provider lane is wired.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const enabled = getBooleanEnv('VIDEO_ENABLED', false)
  if (!enabled) {
    return res.status(501).json({
      error: 'Video generation is not enabled',
      code: 'VIDEO_DISABLED',
      hint: 'Set VIDEO_ENABLED=true when a video provider lane is ready.',
    })
  }

  return res.status(501).json({
    error: 'Video generation provider not implemented',
    code: 'VIDEO_NOT_IMPLEMENTED',
  })
}
