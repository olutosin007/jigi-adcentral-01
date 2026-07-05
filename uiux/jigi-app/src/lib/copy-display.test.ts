import { describe, expect, it } from 'vitest'
import {
  formatCopyCharBudget,
  getPrimaryCopyCardWarning,
  isCopyOverCharLimit,
  resolveCopyCharCount,
} from './copy-display'
import type { CopyResult } from '@/lib/ai'

const baseCopy: CopyResult = {
  headline: 'Stay refreshed',
  body: 'Beat the heat with crisp hydration all summer long.',
  cta: 'Shop now',
}

describe('copy-display', () => {
  it('J1: formats char budget as count / max', () => {
    expect(formatCopyCharBudget({ ...baseCopy, character_count: 142 }, 125)).toBe('142 / 125')
  })

  it('J2: detects over-limit copy', () => {
    expect(isCopyOverCharLimit({ ...baseCopy, character_count: 130 }, 125)).toBe(true)
    expect(isCopyOverCharLimit({ ...baseCopy, character_count: 100 }, 125)).toBe(false)
  })

  it('J3: prefers validation warning on card face', () => {
    const warning = getPrimaryCopyCardWarning(
      { ...baseCopy, validation_warnings: ['Mandatory inclusion missing: summer'] },
      125
    )
    expect(warning).toBe('Mandatory inclusion missing: summer')
  })

  it('J4: falls back to over-limit message when no validation warnings', () => {
    const warning = getPrimaryCopyCardWarning({ ...baseCopy, character_count: 130 }, 125)
    expect(warning).toContain('Over channel limit')
  })

  it('J5: resolves char count from fields when character_count missing', () => {
    expect(resolveCopyCharCount(baseCopy)).toBeGreaterThan(0)
  })
})
