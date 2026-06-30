import { describe, expect, it } from 'vitest'
import { getPrimaryCopyBudgetChars } from './services'

describe('getPrimaryCopyBudgetChars', () => {
  it('returns caption_max-based budget for instagram_post', () => {
    expect(getPrimaryCopyBudgetChars('instagram_post')).toBe(2200)
  })

  it('returns max_chars for facebook_post', () => {
    expect(getPrimaryCopyBudgetChars('facebook_post')).toBe(63206)
  })

  it('returns undefined for empty channel id', () => {
    expect(getPrimaryCopyBudgetChars(undefined)).toBeUndefined()
    expect(getPrimaryCopyBudgetChars('')).toBeUndefined()
  })
})
