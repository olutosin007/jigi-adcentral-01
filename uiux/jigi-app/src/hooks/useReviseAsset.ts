import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadFileToStorage } from '@/lib/upload'
import type { CreativeAsset } from '@/store/campaignStore'

export interface ReviseAssetParams {
  asset: CreativeAsset
  /** Edited text fields, merged over the current content. */
  fields?: Record<string, string>
  file?: File
}

/**
 * Updates content only (never status) for a returned asset before it is resent
 * via POST /api/assets/submit. Bumps version so Decide shows the new revision.
 */
async function reviseAssetFn({ asset, fields, file }: ReviseAssetParams): Promise<CreativeAsset> {
  if (asset.status !== 'changes_requested') throw new Error('Only returned work can be revised')

  const content: Record<string, unknown> = { ...((asset.content ?? {}) as unknown as Record<string, unknown>), ...fields }
  let originalFilename = asset.original_filename ?? null

  if (file) {
    const url = await uploadFileToStorage(asset.campaign_id, `${asset.id}-r${Date.now()}`, file)
    if (asset.type === 'image') content.url = url
    else content.file_url = url
    originalFilename = file.name
  }

  const { data, error } = await supabase
    .from('creative_assets')
    .update({
      content,
      original_filename: originalFilename,
      version: (asset.version ?? 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', asset.id)
    .eq('status', 'changes_requested')
    .select()
    .single()

  if (error) throw error
  return data as CreativeAsset
}

export function useReviseAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reviseAssetFn,
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-assets', asset.campaign_id] })
    },
  })
}
