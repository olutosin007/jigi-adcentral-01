import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'
import { applyReviewDecision } from '../lib/review-domain.js'
import type { ReviewAction } from '../lib/review-links.js'

interface ReviewAssetRequest {
  asset_id: string
  action: ReviewAction
  notes?: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthenticatedUser(
    req.headers.authorization as string
  )

  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const body = req.body as ReviewAssetRequest

  if (!body.asset_id || !body.action) {
    return res.status(400).json({
      error: 'Missing required fields: asset_id, action',
    })
  }

  if (!['approve', 'reject', 'request_changes'].includes(body.action)) {
    return res.status(400).json({
      error: 'Invalid action. Must be: approve, reject, or request_changes',
    })
  }

  try {
    const result = await applyReviewDecision(getSupabaseAdmin(), {
      assetId: body.asset_id,
      action: body.action,
      notes: body.notes,
      actor: { userId: user.id, via: 'app' },
    })

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error, ...result.extra })
    }

    return res.json({
      asset: result.asset,
      previous_status: result.previousStatus,
      new_status: result.newStatus,
      action: body.action,
      reviewed_by: user.id,
    })
  } catch (error) {
    console.error('Asset review error:', error)

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Review failed',
    })
  }
}
