import type { VercelRequest, VercelResponse } from '@vercel/node'
import textHandler from '../generate/text.js'
import { getSupabaseAdmin } from '../lib/supabase.js'

/**
 * Legacy / mistaken path used in some clients and console snippets (`/api/brief/generate`).
 * Delegates to POST /api/generate/text after resolving `prompt` from the body or DB brief.
 */
function briefRecordToPrompt(brief: Record<string, unknown>, seedIdea?: string): string {
  const parts: string[] = []
  if (typeof brief.objective === 'string' && brief.objective.trim()) parts.push(`Objective: ${brief.objective.trim()}`)
  if (typeof brief.key_message === 'string' && brief.key_message.trim())
    parts.push(`Key message: ${brief.key_message.trim()}`)
  if (typeof brief.audience === 'string' && brief.audience.trim()) parts.push(`Audience: ${brief.audience.trim()}`)
  if (Array.isArray(brief.channels) && brief.channels.length)
    parts.push(`Channels: ${(brief.channels as string[]).join(', ')}`)
  if (typeof brief.requirements === 'string' && brief.requirements.trim())
    parts.push(`Requirements: ${brief.requirements.trim()}`)
  if (seedIdea?.trim()) parts.push(`Seed idea: ${seedIdea.trim()}`)
  return (
    parts.join('\n') ||
    'Generate creative concepts for this campaign based on the stored brief.'
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const b = (req.body || {}) as Record<string, unknown>
  const campaignId = typeof b.campaign_id === 'string' ? b.campaign_id : ''
  let prompt =
    typeof b.prompt === 'string'
      ? b.prompt
      : typeof b.text === 'string'
        ? b.text
        : ''
  const typeRaw = typeof b.type === 'string' ? b.type : 'concept'
  const type =
    typeRaw === 'copy' || typeRaw === 'compliance' || typeRaw === 'image_prompt_refine'
      ? typeRaw
      : 'concept'

  if (!campaignId) {
    return res.status(400).json({
      error: 'Missing campaign_id',
      hint:
        'Send JSON { campaign_id, optional prompt } or use POST /api/generate/text with type, campaign_id, prompt.',
    })
  }

  if (!prompt.trim()) {
    try {
      const admin = getSupabaseAdmin()
      const { data: row, error } = await admin
        .from('campaigns')
        .select('brief, seed_idea')
        .eq('id', campaignId)
        .single()
      if (error || !row) {
        return res.status(400).json({
          error: 'Could not load campaign; supply prompt or check campaign_id',
          detail: error?.message,
        })
      }
      const brief = (row.brief || {}) as Record<string, unknown>
      const seed =
        typeof row.seed_idea === 'string' ? row.seed_idea : undefined
      prompt = briefRecordToPrompt(brief, seed)
    } catch (e) {
      return res.status(500).json({
        error: e instanceof Error ? e.message : 'Failed to resolve brief',
      })
    }
  }

  const merged = {
    type,
    campaign_id: campaignId,
    brand_id: typeof b.brand_id === 'string' ? b.brand_id : undefined,
    prompt,
    brand_context: b.brand_context as typeof b.brand_context,
    seed_idea: typeof b.seed_idea === 'string' ? b.seed_idea : undefined,
    concept_context: b.concept_context as typeof b.concept_context,
    prompt_hash: typeof b.prompt_hash === 'string' ? b.prompt_hash : undefined,
    use_prompt_as_system: b.use_prompt_as_system === true,
  }

  const proxiedReq = Object.assign(req, { body: merged }) as VercelRequest
  return textHandler(proxiedReq, res)
}
