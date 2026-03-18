import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../lib/supabase.js'
import { sendEmail, createNudgeEmailHtml } from '../lib/resend.js'

const CRON_SECRET = process.env.CRON_SECRET

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: pendingAssets, error: fetchError } = await supabaseAdmin
      .from('creative_assets')
      .select(`
        id,
        type,
        status,
        updated_at,
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
      .in('status', ['submitted', 'brand_review'])
      .lt('updated_at', twentyFourHoursAgo.toISOString())

    if (fetchError) {
      throw new Error(`Failed to fetch pending assets: ${fetchError.message}`)
    }

    let nudgesSent = 0
    let emailsSent = 0
    const errors: string[] = []

    for (const asset of pendingAssets || []) {
      const campaign = asset.campaigns as {
        id: string
        name: string
        brands: { organisation_id: string }
      }

      const orgId = campaign?.brands?.organisation_id
      if (!orgId) continue

      const { data: existingNudge } = await supabaseAdmin
        .from('nudge_log')
        .select('id')
        .eq('asset_id', asset.id)
        .gte('created_at', todayStart)
        .limit(1)

      if (existingNudge && existingNudge.length > 0) {
        continue
      }

      const { data: reviewers } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('organisation_id', orgId)
        .in('role', ['admin', 'approver'])

      const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173'

      for (const reviewer of reviewers || []) {
        const reviewUrl = `${appUrl}/app/review/${asset.id}`

        await supabaseAdmin.from('notifications').insert({
          user_id: reviewer.id,
          type: 'nudge_reminder',
          title: 'Review reminder',
          body: `"${campaign.name}" has assets waiting for your review`,
          related_asset_id: asset.id,
          related_campaign_id: campaign.id,
        })

        let emailSentSuccess = false

        try {
          await sendEmail({
            to: reviewer.email,
            subject: `Reminder: Asset awaiting your review - ${campaign.name}`,
            html: createNudgeEmailHtml({
              recipientName: reviewer.name || 'there',
              campaignName: campaign.name,
              pendingCount: 1,
              reviewUrl,
            }),
          })

          emailSentSuccess = true
          emailsSent++
        } catch (emailError) {
          errors.push(`Email to ${reviewer.email} failed: ${emailError}`)
        }

        await supabaseAdmin.from('nudge_log').insert({
          asset_id: asset.id,
          user_id: reviewer.id,
          nudge_type: 'pending_24h',
          email_sent: emailSentSuccess,
          notification_created: true,
        })

        nudgesSent++
      }
    }

    return res.json({
      success: true,
      processed_assets: pendingAssets?.length || 0,
      nudges_sent: nudgesSent,
      emails_sent: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Nudge cron error:', error)

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Nudge cron failed',
    })
  }
}
