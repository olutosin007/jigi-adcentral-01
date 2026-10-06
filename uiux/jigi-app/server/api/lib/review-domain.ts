import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail, createApprovalEmailHtml } from './resend.js'
import { REVIEWABLE_STATUSES, type ReviewAction } from './review-links.js'
import { insertStatusHistory } from './status-history.js'

const ACTION_TO_STATUS: Record<ReviewAction, string> = {
  approve: 'approved',
  reject: 'rejected',
  request_changes: 'changes_requested',
}

export interface ReviewActor {
  /** Null for guest-link reviewers who have no account. */
  userId: string | null
  via: 'app' | 'guest_link'
  guestName?: string
  guestEmail?: string
  reviewLinkId?: string
}

export type ReviewDecisionResult =
  | {
      ok: true
      asset: Record<string, unknown>
      previousStatus: string
      newStatus: string
    }
  | { ok: false; status: number; error: string; extra?: Record<string, unknown> }

interface CampaignJoin {
  id: string
  name: string
}

/**
 * Single source of truth for approve / reject / request changes. Used by the
 * authenticated review API and guest review links so status, history, audit
 * and notifications never diverge.
 */
export async function applyReviewDecision(
  admin: SupabaseClient,
  params: { assetId: string; action: ReviewAction; notes?: string; actor: ReviewActor }
): Promise<ReviewDecisionResult> {
  const { assetId, action, notes, actor } = params

  const { data: asset, error: fetchError } = await admin
    .from('creative_assets')
    .select('*, campaigns ( id, name, brand_id )')
    .eq('id', assetId)
    .single()

  if (fetchError || !asset) {
    return { ok: false, status: 404, error: 'Asset not found' }
  }

  if (!REVIEWABLE_STATUSES.includes(asset.status)) {
    return {
      ok: false,
      status: 400,
      error: `Cannot review asset in '${asset.status}' status`,
      extra: { valid_statuses: REVIEWABLE_STATUSES },
    }
  }

  const newStatus = ACTION_TO_STATUS[action]
  const now = new Date().toISOString()

  // Status guard makes concurrent decisions safe: only one update can match.
  const { data: updated, error: updateError } = await admin
    .from('creative_assets')
    .update({
      status: newStatus,
      review_notes: notes || null,
      reviewed_by: actor.userId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', assetId)
    .in('status', REVIEWABLE_STATUSES)
    .select()
    .maybeSingle()

  if (updateError) {
    return { ok: false, status: 500, error: 'Failed to update asset' }
  }
  if (!updated) {
    return { ok: false, status: 409, error: 'This asset has already been decided' }
  }

  const guestAudit =
    actor.via === 'guest_link'
      ? {
          reviewed_via: 'guest_link',
          guest_name: actor.guestName ?? null,
          guest_email: actor.guestEmail ?? null,
          review_link_id: actor.reviewLinkId ?? null,
        }
      : {}

  await insertStatusHistory(admin, {
    asset_id: assetId,
    user_id: actor.userId,
    from_status: asset.status,
    to_status: newStatus,
    notes,
    ...(actor.via === 'guest_link' ? { reviewed_via: 'guest_link' } : {}),
  })

  await admin.from('approval_actions').insert({
    asset_id: assetId,
    user_id: actor.userId,
    action,
    notes,
    ...guestAudit,
  })

  let reviewerName = actor.guestName ? `${actor.guestName} (via review link)` : 'A reviewer'
  if (actor.userId) {
    const { data: reviewer } = await admin
      .from('users')
      .select('name')
      .eq('id', actor.userId)
      .single()
    if (reviewer?.name) reviewerName = reviewer.name
  }

  if (asset.created_by) {
    await notifyCreator(admin, {
      asset,
      campaign: asset.campaigns as CampaignJoin,
      action,
      notes,
      reviewerName,
    })
  }

  return { ok: true, asset: updated, previousStatus: asset.status, newStatus }
}

async function notifyCreator(
  admin: SupabaseClient,
  params: {
    asset: { id: string; type: string; created_by: string; generation_mode?: string }
    campaign: CampaignJoin
    action: ReviewAction
    notes?: string
    reviewerName: string
  }
) {
  const { asset, campaign, action, notes, reviewerName } = params
  const { data: creator } = await admin
    .from('users')
    .select('id, name, email')
    .eq('id', asset.created_by)
    .single()
  if (!creator) return

  const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'
  const notificationType =
    action === 'approve' ? 'approval' : action === 'reject' ? 'rejection' : 'changes_requested'
  const verbPast =
    action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'requested changes on'

  await admin.from('notifications').insert({
    user_id: creator.id,
    type: notificationType,
    title: `Asset ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs changes'}`,
    body: `${reviewerName} ${verbPast} your ${asset.type} for "${campaign.name}"`,
    related_asset_id: asset.id,
    related_campaign_id: campaign.id,
    generation_mode: asset.generation_mode,
  })

  try {
    await sendEmail({
      to: creator.email,
      subject: `Your ${asset.type} was ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back for changes'} - ${campaign.name}`,
      html: createApprovalEmailHtml({
        recipientName: creator.name || 'there',
        campaignName: campaign.name,
        assetType: asset.type,
        action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested',
        reviewerName,
        notes,
        assetUrl: `${appUrl}/app/campaigns/${campaign.id}?stage=decisions`,
      }),
    })

    await admin
      .from('notifications')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('user_id', creator.id)
      .eq('related_asset_id', asset.id)
      .eq('type', notificationType)
  } catch (emailError) {
    console.error('Failed to send review email:', emailError)
  }
}
