import type { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'

const selectCampaignAssetSchema = z.object({
  campaign_id: z.string().uuid(),
  selection: z.enum(['concept', 'copy']),
  asset_id: z.string().uuid().nullable(),
})

type CampaignRow = {
  id: string
  brand_id: string | null
  created_by: string
  selected_concept_asset_id: string | null
  selected_copy_asset_id: string | null
}

type AssetRow = {
  id: string
  campaign_id: string
  type: string
  parent_asset_id: string | null
}

async function assertCampaignAccess(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  campaign: CampaignRow
): Promise<{ allowed: boolean; error?: string }> {
  if (!campaign.brand_id && campaign.created_by === userId) {
    return { allowed: true }
  }

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('organisation_id')
    .eq('id', userId)
    .single()

  const userOrgId = profile?.organisation_id
  if (!userOrgId) {
    return { allowed: false, error: 'You do not have permission to update this campaign' }
  }

  if (campaign.brand_id) {
    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('organisation_id')
      .eq('id', campaign.brand_id)
      .single()

    if (brand?.organisation_id === userOrgId) {
      return { allowed: true }
    }

    const { data: agencyAccess } = await supabaseAdmin
      .from('agency_brand_access')
      .select('brand_id')
      .eq('agency_organisation_id', userOrgId)
      .eq('status', 'active')
      .eq('brand_id', campaign.brand_id)
      .maybeSingle()

    if (agencyAccess) {
      return { allowed: true }
    }
  }

  return { allowed: false, error: 'You do not have permission to update this campaign' }
}

function mapSelectionError(message: string): string {
  if (message.includes('concept')) return message
  if (message.includes('copy')) return message
  if (message.includes('campaign')) return message
  return message
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user, error: authError } = await getAuthenticatedUser(
    req.headers.authorization as string
  )

  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Unauthorized' })
  }

  const parsed = selectCampaignAssetSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    })
  }

  const body = parsed.data

  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, brand_id, created_by, selected_concept_asset_id, selected_copy_asset_id')
      .eq('id', body.campaign_id)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const campaignRow = campaign as CampaignRow
    const access = await assertCampaignAccess(supabaseAdmin, user.id, campaignRow)
    if (!access.allowed) {
      return res.status(403).json({ error: access.error })
    }

    const updatePayload: Record<string, string | null> = {
      selection_updated_at: new Date().toISOString(),
    }

    if (body.selection === 'concept') {
      if (body.asset_id === null) {
        updatePayload.selected_concept_asset_id = null
        updatePayload.selected_copy_asset_id = null
      } else {
        const { data: asset, error: assetError } = await supabaseAdmin
          .from('creative_assets')
          .select('id, campaign_id, type, parent_asset_id')
          .eq('id', body.asset_id)
          .single()

        if (assetError || !asset) {
          return res.status(404).json({ error: 'Asset not found' })
        }

        const assetRow = asset as AssetRow
        if (assetRow.campaign_id !== campaignRow.id) {
          return res.status(400).json({ error: 'Selected concept must belong to this campaign' })
        }
        if (assetRow.type !== 'concept') {
          return res.status(400).json({ error: 'Selected concept asset must be type concept' })
        }

        updatePayload.selected_concept_asset_id = body.asset_id
        if (campaignRow.selected_concept_asset_id !== body.asset_id) {
          updatePayload.selected_copy_asset_id = null
        }
      }
    } else {
      if (body.asset_id === null) {
        updatePayload.selected_copy_asset_id = null
      } else {
        const conceptId = campaignRow.selected_concept_asset_id
        if (!conceptId) {
          return res.status(400).json({ error: 'Select a concept before selecting copy' })
        }

        const { data: asset, error: assetError } = await supabaseAdmin
          .from('creative_assets')
          .select('id, campaign_id, type, parent_asset_id')
          .eq('id', body.asset_id)
          .single()

        if (assetError || !asset) {
          return res.status(404).json({ error: 'Asset not found' })
        }

        const assetRow = asset as AssetRow
        if (assetRow.campaign_id !== campaignRow.id) {
          return res.status(400).json({ error: 'Selected copy must belong to this campaign' })
        }
        if (assetRow.type !== 'copy') {
          return res.status(400).json({ error: 'Selected copy asset must be type copy' })
        }
        if (assetRow.parent_asset_id !== conceptId) {
          return res.status(400).json({ error: 'Copy must belong to the selected concept' })
        }

        updatePayload.selected_copy_asset_id = body.asset_id
      }
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update(updatePayload)
      .eq('id', body.campaign_id)
      .select('*')
      .single()

    if (updateError) {
      const message = mapSelectionError(updateError.message || 'Failed to update campaign selection')
      return res.status(400).json({ error: message })
    }

    return res.json({ campaign: updated })
  } catch (error) {
    console.error('Campaign selection error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Selection update failed',
    })
  }
}
