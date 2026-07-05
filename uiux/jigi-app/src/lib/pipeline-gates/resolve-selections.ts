import type { PipelineGateAsset, PipelineGateInput, ResolvedSelections } from './types'

export function getConceptAssets(assets: PipelineGateAsset[]): PipelineGateAsset[] {
  return assets.filter((asset) => asset.type === 'concept')
}

export function getCopyAssetsForConcept(
  assets: PipelineGateAsset[],
  conceptId: string | null
): PipelineGateAsset[] {
  if (!conceptId) return []
  return assets.filter((asset) => asset.type === 'copy' && asset.parent_asset_id === conceptId)
}

export function getImagesForSelections(
  assets: PipelineGateAsset[],
  conceptId: string | null,
  copyId: string | null
): PipelineGateAsset[] {
  if (!conceptId && !copyId) return []
  return assets.filter((asset) => {
    if (asset.type !== 'image') return false
    if (copyId && asset.parent_asset_id === copyId) return true
    if (conceptId && asset.parent_asset_id === conceptId) return true
    return false
  })
}

export function resolveSelections(input: PipelineGateInput): ResolvedSelections {
  const { campaign, assets } = input
  const conceptId = campaign.selected_concept_asset_id ?? null
  const copyId = campaign.selected_copy_asset_id ?? null

  const resolvedConceptId =
    conceptId && assets.some((asset) => asset.id === conceptId && asset.type === 'concept')
      ? conceptId
      : null

  const resolvedCopyId =
    resolvedConceptId &&
    copyId &&
    assets.some(
      (asset) =>
        asset.id === copyId &&
        asset.type === 'copy' &&
        asset.parent_asset_id === resolvedConceptId
    )
      ? copyId
      : null

  return {
    selectedConceptId: resolvedConceptId,
    selectedCopyId: resolvedCopyId,
  }
}
