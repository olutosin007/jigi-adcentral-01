import type { CampaignBrief } from '@/store/campaignStore'

export type StageGateStatus = 'available' | 'in_progress' | 'complete'

export type PipelineStageId = 'brief' | 'concepts' | 'copy' | 'images' | 'assets'

export type StageGateMap = Record<PipelineStageId, StageGateStatus>

export type PipelineActionType = 'navigate' | 'focus_generate' | 'scroll_selection'

export type NextPipelineAction = {
  label: string
  stage: PipelineStageId
  actionType: PipelineActionType
  reason?: string
}

export type PipelineGateAsset = {
  id: string
  type: 'concept' | 'copy' | 'image'
  parent_asset_id?: string | null
  campaign_id: string
}

export type PipelineGateCampaign = {
  id: string
  journey_mode: 'brand_first' | 'idea_first'
  seed_idea?: string | null
  brief: CampaignBrief
  status: 'draft' | 'active' | 'completed' | 'archived'
  selected_concept_asset_id?: string | null
  selected_copy_asset_id?: string | null
}

export type PipelineGateInput = {
  campaign: PipelineGateCampaign
  assets: PipelineGateAsset[]
}

export type ResolvedSelections = {
  selectedConceptId: string | null
  selectedCopyId: string | null
}
