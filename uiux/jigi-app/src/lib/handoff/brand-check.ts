import type { BrandProfileStatus } from '@/lib/brand-profile-status'
import type { CreativeAsset } from '@/store/campaignStore'
import type { HandoffTone } from './human-status'

export type BrandKitLevel = BrandProfileStatus | 'none'
export type BrandCheckState = 'unchecked' | 'clear' | 'attention' | 'blocking'

export interface BrandCheckSummary {
  state: BrandCheckState
  label: string
  tone: HandoffTone
  /** True whenever the brand kit can't back a confident verdict. */
  guidanceOnly: boolean
  checkedAt?: string
}

interface PersistedValidation {
  valid?: boolean
  blocking?: boolean
  validated_at?: string
}

function readValidation(asset: Pick<CreativeAsset, 'validation_scores'>): PersistedValidation | null {
  const v = asset.validation_scores
  if (!v || typeof v !== 'object') return null
  const { valid, blocking, validated_at } = v as Record<string, unknown>
  if (typeof valid !== 'boolean' && typeof blocking !== 'boolean') return null
  return {
    valid: typeof valid === 'boolean' ? valid : undefined,
    blocking: typeof blocking === 'boolean' ? blocking : undefined,
    validated_at: typeof validated_at === 'string' ? validated_at : undefined,
  }
}

/**
 * Honest brand-check verdict. Never reports "on-brand" unless the brand kit is
 * complete — partial/starter kits downgrade to guidance-only wording.
 */
export function summarizeBrandCheck(
  asset: Pick<CreativeAsset, 'validation_scores' | 'drift_status'>,
  kit: BrandKitLevel
): BrandCheckSummary {
  const guidanceOnly = kit !== 'complete'
  const v = readValidation(asset)

  if (!v) {
    return { state: 'unchecked', label: 'Not checked', tone: 'muted', guidanceOnly }
  }
  if (v.blocking) {
    return {
      state: 'blocking',
      label: 'Brand issue found',
      tone: 'destructive',
      guidanceOnly,
      checkedAt: v.validated_at,
    }
  }
  if (v.valid === false || asset.drift_status === 'review_required') {
    return {
      state: 'attention',
      label: 'Needs a look',
      tone: 'warning',
      guidanceOnly,
      checkedAt: v.validated_at,
    }
  }
  return {
    state: 'clear',
    label: guidanceOnly ? 'No issues found' : 'Looks on-brand',
    tone: guidanceOnly ? 'muted' : 'success',
    guidanceOnly,
    checkedAt: v.validated_at,
  }
}

export function canRunBrandCheck(kit: BrandKitLevel): boolean {
  return kit !== 'none'
}
