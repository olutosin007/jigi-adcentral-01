import type { BrandIdentity, BrandVoice } from '@/store/brandStore'
import { deriveBrandEssentials, type BrandProfileStatus } from './brand-essentials-core'

/** DESIGN.md core palette — shared by quick-create and onboarding defaults */
export const DEFAULT_BRAND_COLOURS = {
  primary: '#0D9488',
  secondary: '#1C1917',
  accent: '#D97706',
  neutral: '#78716C',
} as const

/** DESIGN.md typography — Fraunces display + Source Sans 3 body */
export const DEFAULT_BRAND_FONTS = {
  heading: 'Fraunces',
  body: 'Source Sans 3',
} as const

export {
  deriveBrandEssentials,
  type BrandProfileStatus,
  type BrandEssentialItem,
  type BrandEssentialsResult,
} from './brand-essentials-core'
/** @deprecated Use deriveBrandEssentials for scoring detail; kept for persisted status field */
export function deriveBrandProfileStatus(
  identity?: BrandIdentity,
  voice?: BrandVoice
): BrandProfileStatus {
  return deriveBrandEssentials(identity, voice).status
}
