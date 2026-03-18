import { supabase } from './supabase'
import { sendEmail } from './email/client'
import { nudgeEmailTemplate } from './email/templates/NudgeEmail'
import { createNotification } from './notifications'
import { formatDistanceToNow } from 'date-fns'

type NudgeType = 'pending_24h' | 'pending_48h' | 'opened_no_action'

interface PendingAsset {
  id: string
  name: string
  created_at: string
  campaign_id: string
  created_by?: string
  campaign?: {
    id: string
    name: string
    brand_id?: string
  }
  creator?: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
    }
  }
}

interface NudgeRecipient {
  id: string
  email: string
  full_name: string
}

async function getNudgeRecipientsForAsset(assetId: string): Promise<NudgeRecipient[]> {
  const { data: asset } = await supabase
    .from('creative_assets')
    .select(`
      campaign_id,
      campaigns!inner(brand_id, brands(organisation_id))
    `)
    .eq('id', assetId)
    .single()

  if (!asset?.campaigns) return []

  const campaign = asset.campaigns as { brand_id?: string; brands?: { organisation_id?: string } }
  const orgId = campaign.brands?.organisation_id

  if (!orgId) return []

  const { data: users } = await supabase
    .from('users')
    .select('id, email, user_metadata')
    .eq('organisation_id', orgId)
    .in('role', ['admin', 'brand_manager'])

  if (!users) return []

  return users.map((u) => ({
    id: u.id,
    email: u.email ?? '',
    full_name: u.user_metadata?.full_name ?? 'Team Member',
  }))
}

async function hasRecentNudge(assetId: string, userId: string, nudgeType: NudgeType): Promise<boolean> {
  const hoursAgo = nudgeType === 'pending_24h' ? 24 : nudgeType === 'pending_48h' ? 48 : 12
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from('nudge_log')
    .select('id', { count: 'exact', head: true })
    .eq('asset_id', assetId)
    .eq('user_id', userId)
    .eq('nudge_type', nudgeType)
    .gte('created_at', since)

  return (count ?? 0) > 0
}

async function recordNudge(
  assetId: string,
  userId: string,
  nudgeType: NudgeType,
  emailSent: boolean,
  notificationCreated: boolean
): Promise<void> {
  await supabase.from('nudge_log').insert({
    asset_id: assetId,
    user_id: userId,
    nudge_type: nudgeType,
    email_sent: emailSent,
    notification_created: notificationCreated,
  })
}

async function sendNudge(
  asset: PendingAsset,
  recipient: NudgeRecipient,
  nudgeType: NudgeType
): Promise<void> {
  const pendingDuration = formatDistanceToNow(new Date(asset.created_at), { addSuffix: false })

  const emailHtml = nudgeEmailTemplate({
    recipientName: recipient.full_name,
    assetName: asset.name,
    assetId: asset.id,
    campaignName: asset.campaign?.name ?? 'Unknown Campaign',
    submittedBy: asset.creator?.user_metadata?.full_name ?? 'Team Member',
    pendingDuration,
    nudgeType,
  })

  const emailResult = await sendEmail({
    to: recipient.email,
    subject: `Reminder: "${asset.name}" is waiting for your review`,
    html: emailHtml,
  })

  const notificationTitle = nudgeType === 'pending_24h'
    ? 'Review reminder'
    : nudgeType === 'pending_48h'
      ? 'Asset needs attention'
      : 'Pending action needed'

  const notificationBody = `"${asset.name}" has been pending review for ${pendingDuration}. Please take action.`

  await createNotification({
    userId: recipient.id,
    type: 'nudge_reminder',
    title: notificationTitle,
    body: notificationBody,
    relatedAssetId: asset.id,
    relatedCampaignId: asset.campaign_id,
  })

  await recordNudge(asset.id, recipient.id, nudgeType, emailResult.success, true)
}

export async function checkAndSendNudges(): Promise<{ processed: number; nudgesSent: number }> {
  const now = new Date()
  const h24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  const { data: pendingAssets, error } = await supabase
    .from('creative_assets')
    .select(`
      id,
      name,
      created_at,
      campaign_id,
      created_by,
      campaigns(id, name, brand_id)
    `)
    .in('status', ['submitted', 'brand_review'])
    .order('created_at', { ascending: true })

  if (error || !pendingAssets) {
    console.error('Error fetching pending assets:', error)
    return { processed: 0, nudgesSent: 0 }
  }

  let nudgesSent = 0

  for (const asset of pendingAssets as unknown as PendingAsset[]) {
    const createdAt = new Date(asset.created_at)
    let nudgeType: NudgeType | null = null

    if (createdAt.toISOString() < h48Ago) {
      nudgeType = 'pending_48h'
    } else if (createdAt.toISOString() < h24Ago) {
      nudgeType = 'pending_24h'
    }

    if (!nudgeType) continue

    const recipients = await getNudgeRecipientsForAsset(asset.id)

    for (const recipient of recipients) {
      const hasRecent = await hasRecentNudge(asset.id, recipient.id, nudgeType)
      if (hasRecent) continue

      try {
        await sendNudge(asset, recipient, nudgeType)
        nudgesSent++
      } catch (err) {
        console.error(`Failed to send nudge for asset ${asset.id} to ${recipient.email}:`, err)
      }
    }
  }

  return { processed: pendingAssets.length, nudgesSent }
}

export async function triggerNudgeCheck(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await checkAndSendNudges()
    return {
      success: true,
      message: `Processed ${result.processed} assets, sent ${result.nudgesSent} nudges`,
    }
  } catch (err) {
    console.error('Nudge check failed:', err)
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
