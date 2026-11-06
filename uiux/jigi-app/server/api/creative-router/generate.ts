import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getAuthenticatedUser } from '../lib/supabase.js'
import {
  callGenerateCreatives,
  isCreativeRouterEnabled,
  mapCreativeRouterErrorToMessage,
  type GenerateCreativesPayload,
} from '../lib/creative-router-client.js'

interface GenerateRequest {
  campaign_id: string
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

  if (!isCreativeRouterEnabled()) {
    return res.status(503).json({
      error: 'Creative Router is not enabled',
      code: 'CREATIVE_ROUTER_DISABLED',
    })
  }

  const body = req.body as GenerateRequest
  if (!body?.campaign_id) {
    return res.status(400).json({ error: 'Missing campaign_id' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('id, brand_id, brief')
    .eq('id', body.campaign_id)
    .single()

  if (campaignError || !campaign) {
    return res.status(404).json({ error: 'Campaign not found' })
  }

  const { data: brand } = await supabaseAdmin
    .from('brands')
    .select('id')
    .eq('id', campaign.brand_id)
    .single()

  const brief = (campaign.brief as { objective?: string; audience?: string; channels?: string[]; requirements?: string }) || {}
  const headlines = brief.objective ? [brief.objective] : ['Get started']
  const bodies = brief.requirements ? [brief.requirements.slice(0, 200)] : [brief.audience || 'Join us']
  const ctas = ['Learn more', 'Sign up']

  const payload: GenerateCreativesPayload = {
    campaignId: campaign.id,
    channel: 'meta',
    placements: [
      { placement: 'meta_feed', aspectRatio: '1:1' },
      { placement: 'meta_feed', aspectRatio: '4:5' },
    ],
    phase: 'test_and_learn',
    costProfile: 'template_only',
    brandProfileId: brand?.id ?? campaign.brand_id,
    copy: { headlines, bodies, ctas },
    experimentConfig: { maxVariants: 6 },
  }

  const response = await callGenerateCreatives(payload)
  if (!response) {
    return res.status(503).json({ error: 'Creative Router unavailable' })
  }

  const data = await response.json().catch(() => ({})) as {
    jobId?: string
    status?: string
    variants?: Array<{ id: string; provider: string; templateId?: string; placements: string[]; assetUrl?: string }>
    errorCode?: string
    message?: string
    details?: Record<string, unknown>
  }

  if (!response.ok) {
    const message = mapCreativeRouterErrorToMessage(data.errorCode ?? '')
    const status = response.status === 400 ? 400 : 502
    return res.status(status).json({
      error: message,
      code: data.errorCode,
      details: data.details,
    })
  }

  return res.status(202).json({
    jobId: data.jobId,
    status: data.status ?? 'accepted',
    variants: data.variants ?? [],
  })
}

