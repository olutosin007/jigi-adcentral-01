import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin, getAuthenticatedUser } from './lib/supabase.js'
import { sendEmail, createGuestReviewInviteHtml } from './lib/resend.js'
import { applyReviewDecision } from './lib/review-domain.js'
import { deriveBrandEssentials } from '../../src/lib/brand-essentials-core.js'
import { countRounds, previousRoundSnapshot, roundLabel } from '../../src/lib/handoff/rounds.js'
import { fetchRoundHistory } from './lib/status-history.js'
import {
  REVIEWABLE_STATUSES,
  createRateLimiter,
  evaluateLinkState,
  generateReviewToken,
  hashReviewToken,
  isPlausibleToken,
  linkExpiry,
  sanitizeContentForGuest,
  validateGuestReviewInput,
  type ReviewLinkRow,
} from './lib/review-links.js'

/**
 * Guest Decide links. One function (query-routed) to stay inside the Vercel
 * function budget:
 *   POST /api/review-links                         create (auth)
 *   POST /api/review-links?action=revoke           revoke (auth)
 *   GET  /api/review-links?token=…                 public Decide payload
 *   POST /api/review-links?action=review&token=…   guest decision
 */

const SAFE_LINK_COLUMNS =
  'id, asset_id, campaign_id, brand_id, created_by, recipient_name, recipient_email, expires_at, revoked_at, max_uses, use_count, first_opened_at, last_used_at, decided_at, decision, guest_name, created_at'

const allowView = createRateLimiter(60, 60_000)
const allowDecision = createRateLimiter(10, 60_000)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for']
  const raw = Array.isArray(fwd) ? fwd[0] : fwd
  return (raw?.split(',')[0] ?? req.socket?.remoteAddress ?? 'unknown').trim()
}

function appBaseUrl(req: VercelRequest): string {
  const fromEnv = process.env.VITE_APP_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const origin = req.headers.origin
  if (typeof origin === 'string' && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, '')
  return 'http://localhost:5173'
}

function readToken(req: VercelRequest): string | undefined {
  const q = req.query?.token
  const fromQuery = Array.isArray(q) ? q[0] : q
  const fromBody = (req.body as { token?: unknown } | undefined)?.token
  const token = fromQuery ?? (typeof fromBody === 'string' ? fromBody : undefined)
  return isPlausibleToken(token) ? token : undefined
}

async function canManageCampaign(
  admin: SupabaseClient,
  userId: string,
  campaign: { brand_id: string | null; created_by: string | null; brands: { organisation_id: string } | null }
): Promise<boolean> {
  if (!campaign.brand_id) return campaign.created_by === userId

  const { data: profile } = await admin
    .from('users')
    .select('organisation_id')
    .eq('id', userId)
    .single()
  const orgId = profile?.organisation_id
  if (!orgId) return false
  if (campaign.brands?.organisation_id === orgId) return true

  const { data: agencyAccess } = await admin
    .from('agency_brand_access')
    .select('brand_id')
    .eq('agency_organisation_id', orgId)
    .eq('status', 'active')
    .eq('brand_id', campaign.brand_id)
    .maybeSingle()
  return !!agencyAccess
}

async function findLinkByToken(admin: SupabaseClient, token: string) {
  const { data } = await admin
    .from('review_links')
    .select(SAFE_LINK_COLUMNS)
    .eq('token_hash', hashReviewToken(token))
    .maybeSingle()
  return data as (ReviewLinkRow & Record<string, unknown>) | null
}

async function handleCreate(req: VercelRequest, res: VercelResponse, admin: SupabaseClient, userId: string) {
  const body = (req.body ?? {}) as {
    asset_id?: string
    recipient_name?: string
    recipient_email?: string
    expires_in_days?: number
    send_email?: boolean
    message?: string
  }
  if (!body.asset_id) return res.status(400).json({ error: 'Missing required field: asset_id' })

  const recipientEmail = body.recipient_email?.trim() || null
  if (recipientEmail && !EMAIL_RE.test(recipientEmail)) {
    return res.status(400).json({ error: 'Recipient email does not look right' })
  }

  const { data: asset } = await admin
    .from('creative_assets')
    .select('id, type, status, campaign_id, campaigns ( id, name, brand_id, created_by, brands ( id, name, organisation_id ) )')
    .eq('id', body.asset_id)
    .single()
  if (!asset) return res.status(404).json({ error: 'Asset not found' })

  const campaign = asset.campaigns as unknown as {
    id: string
    name: string
    brand_id: string | null
    created_by: string | null
    brands: { id: string; name: string; organisation_id: string } | null
  }
  if (!(await canManageCampaign(admin, userId, campaign))) {
    return res.status(403).json({ error: 'You do not have permission to share this asset' })
  }
  if (!REVIEWABLE_STATUSES.includes(asset.status)) {
    return res.status(400).json({ error: 'Send this asset to the client before sharing a review link' })
  }

  const token = generateReviewToken()
  const expiresAt = linkExpiry(body.expires_in_days)
  const { data: link, error } = await admin
    .from('review_links')
    .insert({
      token_hash: hashReviewToken(token),
      asset_id: asset.id,
      campaign_id: campaign.id,
      brand_id: campaign.brand_id,
      created_by: userId,
      recipient_name: body.recipient_name?.trim().slice(0, 120) || null,
      recipient_email: recipientEmail,
      expires_at: expiresAt.toISOString(),
    })
    .select(SAFE_LINK_COLUMNS)
    .single()
  if (error || !link) return res.status(500).json({ error: 'Could not create review link' })

  const round = countRounds(await fetchRoundHistory(admin, asset.id), asset.status)
  const url = `${appBaseUrl(req)}/r/${token}`
  let emailSent = false
  if (body.send_email && recipientEmail) {
    try {
      const { data: sender } = await admin.from('users').select('name, email').eq('id', userId).single()
      await sendEmail({
        to: recipientEmail,
        subject:
          round >= 2 ? `Revised — ${roundLabel(round)}: ${campaign.name}` : `Decision needed: ${campaign.name}`,
        replyTo: sender?.email ?? undefined,
        html: createGuestReviewInviteHtml({
          recipientName: body.recipient_name,
          senderName: sender?.name || 'Your creative team',
          brandName: campaign.brands?.name,
          campaignName: campaign.name,
          assetType: asset.type,
          message: body.message?.slice(0, 2000),
          reviewUrl: url,
          expiresAt: expiresAt.toISOString(),
          round,
        }),
      })
      emailSent = true
    } catch (e) {
      console.error('Guest invite email failed:', e)
    }
  }

  return res.status(201).json({ link, url, token, email_sent: emailSent })
}

async function handleRevoke(req: VercelRequest, res: VercelResponse, admin: SupabaseClient, userId: string) {
  const linkId = (req.body as { link_id?: string } | undefined)?.link_id
  if (!linkId) return res.status(400).json({ error: 'Missing required field: link_id' })

  const { data: link } = await admin
    .from('review_links')
    .select('id, revoked_at, campaigns ( brand_id, created_by, brands ( organisation_id ) )')
    .eq('id', linkId)
    .single()
  if (!link) return res.status(404).json({ error: 'Link not found' })

  const campaign = link.campaigns as unknown as Parameters<typeof canManageCampaign>[2]
  if (!(await canManageCampaign(admin, userId, campaign))) {
    return res.status(403).json({ error: 'You do not have permission to revoke this link' })
  }

  const { data: updated, error } = await admin
    .from('review_links')
    .update({ revoked_at: link.revoked_at ?? new Date().toISOString() })
    .eq('id', linkId)
    .select(SAFE_LINK_COLUMNS)
    .single()
  if (error) return res.status(500).json({ error: 'Could not revoke link' })
  return res.json({ link: updated })
}

async function handleView(req: VercelRequest, res: VercelResponse, admin: SupabaseClient, token: string) {
  if (!allowView(`view:${clientIp(req)}`)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })
  }
  const link = await findLinkByToken(admin, token)
  if (!link) return res.status(404).json({ state: 'not_found', error: 'This review link is not valid' })

  const state = evaluateLinkState(link)
  if (state === 'revoked' || state === 'expired' || state === 'used_up') {
    return res.status(410).json({ state, error: 'This review link is no longer active' })
  }

  const [{ data: asset }, { data: campaign }, history] = await Promise.all([
    admin
      .from('creative_assets')
      .select('id, type, status, source, content, original_filename, version, submission_note, review_notes, validation_scores, drift_status, compliance_check, created_at, updated_at')
      .eq('id', link.asset_id)
      .single(),
    admin
      .from('campaigns')
      .select('id, name, brief, brand_id, brands ( name, identity, voice )')
      .eq('id', link.campaign_id)
      .single(),
    fetchRoundHistory(admin, link.asset_id),
  ])
  if (!asset || !campaign) return res.status(404).json({ state: 'not_found', error: 'This review link is not valid' })

  const now = new Date().toISOString()
  await admin
    .from('review_links')
    .update({ first_opened_at: (link.first_opened_at as string | null) ?? now, last_used_at: now })
    .eq('id', link.id)

  const brief = (campaign.brief ?? {}) as Record<string, unknown>
  const brand = campaign.brands as unknown as {
    name: string
    identity?: Record<string, unknown>
    voice?: Record<string, unknown>
  } | null
  const identity = (brand?.identity ?? {}) as { logo_url?: string; colours?: { primary?: string } }
  const brandKit = brand
    ? deriveBrandEssentials(
        brand.identity as Parameters<typeof deriveBrandEssentials>[0],
        brand.voice as Parameters<typeof deriveBrandEssentials>[1]
      ).status
    : 'none'

  const previousSnapshot = previousRoundSnapshot(history)

  return res.json({
    state,
    link: {
      expires_at: link.expires_at,
      recipient_name: link.recipient_name,
      decided_at: link.decided_at,
      decision: link.decision,
      guest_name: link.guest_name,
    },
    asset: { ...asset, content: sanitizeContentForGuest(asset.content) },
    brand_kit: brandKit,
    round: countRounds(history, asset.status as string),
    previous_content: previousSnapshot ? sanitizeContentForGuest(previousSnapshot) : null,
    campaign: {
      name: campaign.name,
      brief: {
        objective: brief.objective ?? null,
        key_message: brief.key_message ?? null,
        audience: brief.audience ?? null,
        channels: Array.isArray(brief.channels) ? brief.channels : [],
      },
    },
    brand: brand
      ? { name: brand.name, logo_url: identity.logo_url ?? null, primary_colour: identity.colours?.primary ?? null }
      : null,
  })
}

async function handleGuestDecision(req: VercelRequest, res: VercelResponse, admin: SupabaseClient, token: string) {
  if (!allowDecision(`decide:${clientIp(req)}`)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.' })
  }
  const parsed = validateGuestReviewInput(req.body)
  if (!parsed.ok) return res.status(400).json({ error: parsed.error })

  const link = await findLinkByToken(admin, token)
  if (!link) return res.status(404).json({ state: 'not_found', error: 'This review link is not valid' })
  const state = evaluateLinkState(link)
  if (state !== 'active') {
    return res.status(state === 'decided' ? 409 : 410).json({ state, error: 'This review link is no longer active' })
  }

  const { action, notes, guestName, guestEmail } = parsed.value
  const result = await applyReviewDecision(admin, {
    assetId: link.asset_id,
    action,
    notes,
    actor: { userId: null, via: 'guest_link', guestName, guestEmail, reviewLinkId: link.id },
  })
  if (!result.ok) {
    const human =
      result.status === 409 || result.status === 400
        ? 'This creative has already been decided or was pulled back by the team'
        : result.error
    return res.status(result.status).json({ error: human })
  }

  const now = new Date().toISOString()
  await admin
    .from('review_links')
    .update({
      decided_at: now,
      decision: action,
      guest_name: guestName,
      guest_email: guestEmail ?? null,
      use_count: (link.use_count ?? 0) + 1,
      last_used_at: now,
    })
    .eq('id', link.id)

  return res.json({ state: 'decided', decision: action, new_status: result.newStatus })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = typeof req.query?.action === 'string' ? req.query.action : undefined

  try {
    const admin = getSupabaseAdmin()

    if (req.method === 'GET') {
      const token = readToken(req)
      if (!token) return res.status(404).json({ state: 'not_found', error: 'This review link is not valid' })
      return await handleView(req, res, admin, token)
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    if (action === 'review') {
      const token = readToken(req)
      if (!token) return res.status(404).json({ state: 'not_found', error: 'This review link is not valid' })
      return await handleGuestDecision(req, res, admin, token)
    }

    const { user, error: authError } = await getAuthenticatedUser(req.headers.authorization as string)
    if (authError || !user) return res.status(401).json({ error: authError || 'Unauthorized' })

    if (action === 'revoke') return await handleRevoke(req, res, admin, user.id)
    return await handleCreate(req, res, admin, user.id)
  } catch (error) {
    console.error('review-links error:', error)
    return res.status(500).json({ error: 'Review link request failed' })
  }
}
