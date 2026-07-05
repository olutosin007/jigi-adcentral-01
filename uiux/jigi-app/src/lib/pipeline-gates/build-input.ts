import type { Campaign, CreativeAsset } from '@/store/campaignStore'
import type { PipelineGateAsset, PipelineGateInput } from './types'

export function buildPipelineGateInput(
  campaign: Campaign,
  assets: CreativeAsset[]
): PipelineGateInput {
  const gateAssets: PipelineGateAsset[] = assets.map((asset) => ({
    id: asset.id,
    type: asset.type,
    parent_asset_id: asset.parent_asset_id ?? null,
    campaign_id: asset.campaign_id,
  }))

  return {
    campaign: {
      id: campaign.id,
      journey_mode: campaign.journey_mode,
      seed_idea: campaign.seed_idea ?? null,
      brief: campaign.brief ?? {},
      status: campaign.status,
      selected_concept_asset_id: campaign.selected_concept_asset_id ?? null,
      selected_copy_asset_id: campaign.selected_copy_asset_id ?? null,
    },
    assets: gateAssets,
  }
}
