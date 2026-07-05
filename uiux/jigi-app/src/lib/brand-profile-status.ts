import type { BrandIdentity, BrandVoice } from '@/store/brandStore'

export function deriveBrandProfileStatus(
  identity?: BrandIdentity,
  voice?: BrandVoice
): 'starter' | 'partial' | 'complete' {
  const colours = identity?.colours
  const fonts = identity?.fonts
  const tone = voice?.tone ?? []

  const hasColors = Boolean(colours?.primary?.trim())
  const hasFonts = Boolean(fonts?.heading?.trim() && fonts?.body?.trim())
  const hasTone = tone.length >= 3

  if (hasColors && hasFonts && hasTone) return 'complete'
  if (hasColors || hasFonts || tone.length > 0) return 'partial'
  return 'starter'
}
