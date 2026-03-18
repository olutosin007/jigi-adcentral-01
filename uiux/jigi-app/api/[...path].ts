import type { VercelRequest, VercelResponse } from '@vercel/node'

import health from '../server/api/health.js'
import generateText from '../server/api/generate/text.js'
import generateImage from '../server/api/generate/image.js'
import submitAsset from '../server/api/assets/submit.js'
import reviewAsset from '../server/api/assets/review.js'
import sendNotification from '../server/api/notifications/send.js'
import nudgeCron from '../server/api/cron/nudge.js'
import creativeRouterGenerate from '../server/api/creative-router/generate.js'

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>

const ROUTES: Record<string, Handler> = {
  'GET /api/health': health,
  'POST /api/generate/text': generateText,
  'POST /api/generate/image': generateImage,
  'POST /api/assets/submit': submitAsset,
  'POST /api/assets/review': reviewAsset,
  'POST /api/notifications/send': sendNotification,
  'GET /api/cron/nudge': nudgeCron,
  'POST /api/cron/nudge': nudgeCron,
  'POST /api/creative-router/generate': creativeRouterGenerate,
}

function getPathFromCatchAll(req: VercelRequest): string {
  const raw = (req.query?.path ?? []) as string | string[]
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : []
  return `/api/${segments.join('/')}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = getPathFromCatchAll(req)
  const key = `${(req.method || 'GET').toUpperCase()} ${pathname}`
  const route = ROUTES[key]

  if (!route) {
    return res.status(404).json({ error: 'Not found', path: pathname })
  }

  return await route(req, res)
}

