import type { SupabaseClient } from '@supabase/supabase-js'

export interface SaveConceptInput {
  campaignId: string
  userId: string
  generationMode: 'brand_grounded' | 'idea_first'
  concepts: Record<string, unknown>[]
  promptHash?: string | null
  lineage?: {
    cco_version?: number
    bio_version?: number
    generation_timestamp?: string
  }
}

export async function saveConceptAssets(
  supabaseAdmin: SupabaseClient,
  input: SaveConceptInput
): Promise<Record<string, unknown>[]> {
  const { campaignId, userId, generationMode, concepts, promptHash, lineage } = input
  const saved: Record<string, unknown>[] = []

  for (const concept of concepts.slice(0, 2)) {
    const insertPayload: Record<string, unknown> = {
      campaign_id: campaignId,
      created_by: userId,
      type: 'concept',
      generation_mode: generationMode,
      content: concept,
      status: 'draft',
    }
    if (lineage?.cco_version != null) insertPayload.cco_version = lineage.cco_version
    if (lineage?.bio_version != null) insertPayload.bio_version = lineage.bio_version
    if (lineage?.generation_timestamp != null) {
      insertPayload.generation_timestamp = lineage.generation_timestamp
    }
    if (promptHash != null) {
      insertPayload.validation_scores = { prompt_hash: promptHash }
    }

    const { data, error } = await supabaseAdmin
      .from('creative_assets')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw new Error(`Failed to save concept asset: ${error.message}`)
    saved.push(data as Record<string, unknown>)
  }

  return saved
}
