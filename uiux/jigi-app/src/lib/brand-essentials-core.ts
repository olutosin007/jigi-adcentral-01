/**
 * Dependency-free brand-kit essentials scoring. Imported by both the browser
 * (via brand-profile-status) and server functions, so it must not import
 * app modules or path aliases.
 */

export interface EssentialsIdentity {
  colours?: { primary?: string | null } | null
  fonts?: { heading?: string | null; body?: string | null } | null
  logo_url?: string | null
  visual_style?: string | null
}

export interface EssentialsVoice {
  tone?: string[] | null
  preferred_words?: string[] | null
  avoided_words?: string[] | null
}

export type BrandProfileStatus = 'starter' | 'partial' | 'complete'

export interface BrandEssentialItem {
  id: string
  label: string
  met: boolean
  recommended?: boolean
}

export interface BrandEssentialsResult {
  score: number
  maxScore: number
  missing: string[]
  recommendedMissing: string[]
  status: BrandProfileStatus
  items: BrandEssentialItem[]
}

const MIN_VISUAL_STYLE_CHARS = 20
const MIN_WORD_LIST_TOTAL = 3

function evaluateEssentials(identity?: EssentialsIdentity, voice?: EssentialsVoice): BrandEssentialItem[] {
  const colours = identity?.colours
  const fonts = identity?.fonts
  const tone = voice?.tone ?? []
  const preferred = voice?.preferred_words ?? []
  const avoided = voice?.avoided_words ?? []

  return [
    {
      id: 'primary_colour',
      label: 'Primary colour',
      met: Boolean(colours?.primary?.trim()),
    },
    {
      id: 'typography',
      label: 'Heading + body font',
      met: Boolean(fonts?.heading?.trim() && fonts?.body?.trim()),
    },
    {
      id: 'tone',
      label: 'At least 1 tone descriptor',
      met: tone.length >= 1,
    },
    {
      id: 'logo',
      label: 'Logo uploaded',
      met: Boolean(identity?.logo_url?.trim()),
      recommended: true,
    },
    {
      id: 'word_lists',
      label: 'Preferred or avoided words (3+ total)',
      met: preferred.length + avoided.length >= MIN_WORD_LIST_TOTAL,
      recommended: true,
    },
    {
      id: 'visual_style',
      label: 'Visual style description',
      met: (identity?.visual_style?.trim().length ?? 0) >= MIN_VISUAL_STYLE_CHARS,
    },
  ]
}

function statusFromScore(score: number): BrandProfileStatus {
  if (score >= 5) return 'complete'
  if (score >= 3) return 'partial'
  return 'starter'
}

export function deriveBrandEssentials(
  identity?: EssentialsIdentity,
  voice?: EssentialsVoice
): BrandEssentialsResult {
  const items = evaluateEssentials(identity, voice)
  const score = items.filter((item) => item.met).length
  const missing = items.filter((item) => !item.met && !item.recommended).map((item) => item.label)
  const recommendedMissing = items
    .filter((item) => !item.met && item.recommended)
    .map((item) => item.label)

  return {
    score,
    maxScore: items.length,
    missing,
    recommendedMissing,
    status: statusFromScore(score),
    items,
  }
}

