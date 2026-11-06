import { describe, expect, it } from 'vitest'
import { getPrimaryCopyBudgetChars, getCopyPromptBudget } from './services'

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

describe('getCopyPromptBudget', () => {
  it('picks the tight overlay budget for instagram_story (not the loose caption max)', () => {
    const b = getCopyPromptBudget('instagram_story')
    expect(b?.primaryMax).toBe(125)
    expect(b?.source).toBe('instagram_story')
  })

  it('uses the visible budget + per-field caps for facebook_ad', () => {
    const b = getCopyPromptBudget('facebook_ad')
    expect(b?.primaryMax).toBe(125)
    expect(b?.headlineMax).toBe(40)
    expect(b?.ctaMax).toBe(25)
  })

  it('respects a genuine hard max when no practical key exists (twitter_post)', () => {
    expect(getCopyPromptBudget('twitter_post')?.primaryMax).toBe(280)
  })

  it('falls back to the default budget for unknown channels', () => {
    const b = getCopyPromptBudget('meta_feed')
    expect(b?.source).toBe('default')
    expect(b?.primaryMax).toBeGreaterThan(0)
  })

  it('returns undefined for empty channel id', () => {
    expect(getCopyPromptBudget(undefined)).toBeUndefined()
    expect(getCopyPromptBudget('')).toBeUndefined()
  })
})
