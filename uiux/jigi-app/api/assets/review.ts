import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'
import { sendEmail, createApprovalEmailHtml } from '../lib/resend.js'

type ReviewAction = 'approve' | 'reject' | 'request_changes'

interface ReviewAssetRequest {
  asset_id: string
  action: ReviewAction
  notes?: string
}

const ACTION_TO_STATUS: Record<ReviewAction, string> = {
  approve: 'approved',
  reject: 'rejected',
  request_changes: 'changes_requested',
}

const VALID_REVIEW_STATUSES = ['submitted', 'brand_review']

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
    const supabaseAdmin = getSupabaseAdmin()
    const { data: asset, error: fetchError } = await supabaseAdmin
      .from('creative_assets')
      .select(`
        *,
        campaigns (
          id,
          name,
          brand_id,
          brands (
            id,
            name,
            organisation_id
          )
        )
      `)
      .eq('id', body.asset_id)
      .single()

    if (fetchError || !asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    if (!VALID_REVIEW_STATUSES.includes(asset.status)) {
      return res.status(400).json({
        error: `Cannot review asset in '${asset.status}' status`,
        valid_statuses: VALID_REVIEW_STATUSES,
      })
    }

    const newStatus = ACTION_TO_STATUS[body.action]

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('creative_assets')
      .update({
        status: newStatus,
        review_notes: body.notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.asset_id)
      .select()
      .single()

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update asset' })
    }

    await supabaseAdmin.from('asset_status_history').insert({
      asset_id: body.asset_id,
      user_id: user.id,
      from_status: asset.status,
      to_status: newStatus,
      notes: body.notes,
    })

    await supabaseAdmin.from('approval_actions').insert({
      asset_id: body.asset_id,
      user_id: user.id,
      action: body.action,
      notes: body.notes,
    })

    const { data: reviewer } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    if (asset.created_by) {
      const { data: creator } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('id', asset.created_by)
        .single()

      const campaign = asset.campaigns as { id: string; name: string }
      const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

      const notificationType = body.action === 'approve'
        ? 'approval'
        : body.action === 'reject'
        ? 'rejection'
        : 'changes_requested'

      if (creator) {
        await supabaseAdmin.from('notifications').insert({
          user_id: creator.id,
          type: notificationType,
          title: `Asset ${body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'needs changes'}`,
          body: `${reviewer?.name || 'A reviewer'} ${body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'requested changes on'} your ${asset.type} for "${campaign.name}"`,
          related_asset_id: body.asset_id,
          related_campaign_id: campaign.id,
          generation_mode: asset.generation_mode,
        })

        try {
          await sendEmail({
            to: creator.email,
            subject: `Your ${asset.type} was ${body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'sent back for changes'} - ${campaign.name}`,
            html: createApprovalEmailHtml({
              recipientName: creator.name || 'there',
              campaignName: campaign.name,
              assetType: asset.type,
              action: body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'changes_requested',
              reviewerName: reviewer?.name || 'A reviewer',
              notes: body.notes,
              assetUrl: `${appUrl}/app/campaigns/${campaign.id}`,
            }),
          })

          await supabaseAdmin
            .from('notifications')
            .update({ email_sent: true, email_sent_at: new Date().toISOString() })
            .eq('user_id', creator.id)
            .eq('related_asset_id', body.asset_id)
            .eq('type', notificationType)
        } catch (emailError) {
          console.error('Failed to send review email:', emailError)
        }
      }
    }

    return res.json({
      asset: updated,
      previous_status: asset.status,
      new_status: newStatus,
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
