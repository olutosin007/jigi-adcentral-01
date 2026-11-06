import { describe, expect, it } from 'vitest'
import {
  IMAGE_ASPECT_OPTIONS,
  formatCostUsd,
  formatLaneLabel,
  nearestSupportedAspect,
} from './image-tiers'
import { CHANNEL_CONSTRAINTS_LIBRARY } from './channel-constraints'

describe('nearestSupportedAspect', () => {
  it('returns supported ratios unchanged', () => {
    for (const option of IMAGE_ASPECT_OPTIONS) {
      expect(nearestSupportedAspect(option.id)).toBe(option.id)
    }
  })

  it('maps non-native channel ratios to the closest supported ratio', () => {
    expect(nearestSupportedAspect('1.91:1')).toBe('16:9')
    expect(nearestSupportedAspect('6:5')).toBe('1:1')
    expect(nearestSupportedAspect('3:4')).toBe('4:5')
    expect(nearestSupportedAspect('3.6:1')).toBe('16:9')
  })

  it('falls back to 1:1 for missing or malformed input', () => {
    expect(nearestSupportedAspect(undefined)).toBe('1:1')
    expect(nearestSupportedAspect(null)).toBe('1:1')
    expect(nearestSupportedAspect('wide')).toBe('1:1')
    expect(nearestSupportedAspect('0:1')).toBe('1:1')
  })

  it('drift: every channel in the library resolves to a supported ratio', () => {
    const supported = new Set(IMAGE_ASPECT_OPTIONS.map((o) => o.id))
    for (const [channelId, config] of Object.entries(CHANNEL_CONSTRAINTS_LIBRARY)) {
      const resolved = nearestSupportedAspect(config.image_dimensions?.aspect_ratio)
      expect(supported.has(resolved), channelId).toBe(true)
    }
  })
})

describe('formatCostUsd', () => {
  it('formats sub-dime costs to 3 decimals', () => {
    expect(formatCostUsd(0.014)).toBe('~$0.014')
    expect(formatCostUsd(0.0504)).toBe('~$0.050')
  })

  it('handles tiny, large and missing values', () => {
    expect(formatCostUsd(0.002)).toBe('<$0.01')
    expect(formatCostUsd(0.12)).toBe('~$0.12')
    expect(formatCostUsd(null)).toBe('')
    expect(formatCostUsd(Number.NaN)).toBe('')
  })
})

describe('formatLaneLabel', () => {
  it('maps stored cost buckets to lane labels', () => {
    expect(formatLaneLabel('free')).toBe('Primary lane')
    expect(formatLaneLabel('paid_fallback')).toBe('Fallback')
    expect(formatLaneLabel(undefined)).toBe('')
  })
})
