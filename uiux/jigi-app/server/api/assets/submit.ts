import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'
import { sendEmail, createSubmissionEmailHtml } from '../lib/resend.js'

interface SubmitAssetRequest {
  asset_id: string
  target: 'agency_review' | 'brand_review'
  message?: string
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['agency_review', 'submitted'],
  agency_review: ['draft', 'submitted'],
  submitted: ['brand_review'],
  changes_requested: ['draft', 'submitted'],
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

  const body = req.body as SubmitAssetRequest

  if (!body.asset_id || !body.target) {
    return res.status(400).json({
      error: 'Missing required fields: asset_id, target',
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

    const campaign = asset.campaigns as {
      id: string
      name: string
      brand_id: string
      brands: { id: string; name: string; organisation_id: string }
    } | null

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('organisation_id')
      .eq('id', user.id)
      .single()

    const userOrgId = profile?.organisation_id
    const brandOrgId = campaign?.brands?.organisation_id

    const hasBrandAccess =
      userOrgId && brandOrgId && userOrgId === brandOrgId

    const { data: agencyAccess } = await supabaseAdmin
      .from('agency_brand_access')
      .select('brand_id')
      .eq('agency_organisation_id', userOrgId)
      .eq('status', 'active')
      .eq('brand_id', campaign?.brand_id ?? '')
      .maybeSingle()

    const hasAgencyAccess = !!agencyAccess

    if (!hasBrandAccess && !hasAgencyAccess) {
      return res.status(403).json({
        error: 'You do not have permission to submit this asset for review',
      })
    }

    const newStatus = body.target === 'brand_review' ? 'submitted' : 'agency_review'
    const validTransitions = STATUS_TRANSITIONS[asset.status] || []

    if (!validTransitions.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition from '${asset.status}' to '${newStatus}'`,
        valid_transitions: validTransitions,
      })
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('creative_assets')
      .update({
        status: newStatus,
        submission_note: body.message || null,
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
      notes: body.message,
    })

    const { data: submitter } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    const orgId = campaign?.brands?.organisation_id

    if (orgId && newStatus === 'submitted') {
      const { data: reviewers } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('organisation_id', orgId)
        .in('role', ['admin', 'approver'])

      const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

      for (const reviewer of reviewers || []) {
        const { data: notification } = await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: reviewer.id,
            type: 'submission',
            title: 'New asset submitted for review',
            body: `${submitter?.name || 'A team member'} submitted a ${asset.type} for "${campaign.name}"`,
            related_asset_id: body.asset_id,
            related_campaign_id: campaign.id,
            generation_mode: asset.generation_mode,
          })
          .select('id')
          .single()

        try {
          await sendEmail({
            to: reviewer.email,
            subject: `New ${asset.type} submitted for review - ${campaign.name}`,
            html: createSubmissionEmailHtml({
              recipientName: reviewer.name || 'there',
              campaignName: campaign.name,
              assetType: asset.type,
              submitterName: submitter?.name || 'A team member',
              reviewUrl: `${appUrl}/app/review/${body.asset_id}`,
            }),
          })

          if (notification?.id) {
            await supabaseAdmin
              .from('notifications')
              .update({ email_sent: true, email_sent_at: new Date().toISOString() })
              .eq('id', notification.id)
          }
        } catch (emailError) {
          console.error('Failed to send submission email:', emailError)
        }
      }
    }

    return res.json({
      asset: updated,
      previous_status: asset.status,
      new_status: newStatus,
      notifications_sent: newStatus === 'submitted',
    })
  } catch (error) {
    console.error('Asset submission error:', error)

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Submission failed',
    })
  }
}

