import { describe, it, expect } from 'vitest'
import {
  createRateLimiter,
  escapeHtml,
  evaluateLinkState,
  generateReviewToken,
  hashReviewToken,
  isPlausibleToken,
  linkExpiry,
  sanitizeContentForGuest,
  validateGuestReviewInput,
} from './review-links'

const NOW = new Date('2026-10-06T12:00:00Z')
const base = {
  expires_at: '2026-10-20T12:00:00Z',
  revoked_at: null,
  max_uses: null,
  use_count: 0,
  decided_at: null,
}

describe('review link tokens', () => {
  it('generates unique, plausible tokens and stable hashes', () => {
    const a = generateReviewToken()
    const b = generateReviewToken()
    expect(a).not.toBe(b)
    expect(isPlausibleToken(a)).toBe(true)
    expect(hashReviewToken(a)).toBe(hashReviewToken(a))
    expect(hashReviewToken(a)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashReviewToken(a)).not.toContain(a)
  })

  it('rejects implausible tokens', () => {
    expect(isPlausibleToken('short')).toBe(false)
    expect(isPlausibleToken("x'; drop table--".padEnd(43, 'a'))).toBe(false)
    expect(isPlausibleToken(undefined)).toBe(false)
  })

  it('clamps expiry between 1 and 60 days, default 14', () => {
    const day = 24 * 60 * 60 * 1000
    expect(linkExpiry(undefined, NOW).getTime() - NOW.getTime()).toBe(14 * day)
    expect(linkExpiry(0.2, NOW).getTime() - NOW.getTime()).toBe(1 * day)
    expect(linkExpiry(365, NOW).getTime() - NOW.getTime()).toBe(60 * day)
    expect(linkExpiry(-5, NOW).getTime() - NOW.getTime()).toBe(1 * day)
  })
})

describe('evaluateLinkState (lifecycle)', () => {
  it('is active within TTL', () => {
    expect(evaluateLinkState(base, NOW)).toBe('active')
  })
  it('fails closed when expired', () => {
    expect(evaluateLinkState({ ...base, expires_at: '2026-10-06T11:59:59Z' }, NOW)).toBe('expired')
    expect(evaluateLinkState({ ...base, expires_at: NOW.toISOString() }, NOW)).toBe('expired')
  })
  it('revocation wins over everything', () => {
    expect(
      evaluateLinkState({ ...base, revoked_at: NOW.toISOString(), decided_at: NOW.toISOString() }, NOW)
    ).toBe('revoked')
  })
  it('is single-decision', () => {
    expect(evaluateLinkState({ ...base, decided_at: NOW.toISOString() }, NOW)).toBe('decided')
  })
  it('respects max uses', () => {
    expect(evaluateLinkState({ ...base, max_uses: 3, use_count: 3 }, NOW)).toBe('used_up')
    expect(evaluateLinkState({ ...base, max_uses: 3, use_count: 2 }, NOW)).toBe('active')
  })
})

describe('validateGuestReviewInput (action matrix)', () => {
  it.each(['approve', 'reject'])('accepts %s with just a name', (action) => {
    const r = validateGuestReviewInput({ action, guest_name: 'Ada' })
    expect(r.ok).toBe(true)
  })
  it('requires notes for request_changes', () => {
    expect(validateGuestReviewInput({ action: 'request_changes', guest_name: 'Ada' }).ok).toBe(false)
    expect(
      validateGuestReviewInput({ action: 'request_changes', guest_name: 'Ada', notes: 'Bigger logo' }).ok
    ).toBe(true)
  })
  it('rejects unknown actions, missing names and bad emails', () => {
    expect(validateGuestReviewInput({ action: 'delete', guest_name: 'Ada' }).ok).toBe(false)
    expect(validateGuestReviewInput({ action: 'approve', guest_name: '  ' }).ok).toBe(false)
    expect(validateGuestReviewInput({ action: 'approve', guest_name: 'Ada', guest_email: 'nope' }).ok).toBe(false)
    expect(validateGuestReviewInput(null).ok).toBe(false)
  })
  it('trims and normalises', () => {
    const r = validateGuestReviewInput({ action: 'approve', guest_name: ' Ada ', guest_email: ' a@b.co ', notes: ' ' })
    expect(r).toEqual({ ok: true, value: { action: 'approve', guestName: 'Ada', guestEmail: 'a@b.co', notes: undefined } })
  })
})

describe('rate limiter + escaping', () => {
  it('limits within window then resets', () => {
    const allow = createRateLimiter(2, 1000)
    expect(allow('k', 0)).toBe(true)
    expect(allow('k', 10)).toBe(true)
    expect(allow('k', 20)).toBe(false)
    expect(allow('k', 1001)).toBe(true)
  })
  it('escapes HTML', () => {
    expect(escapeHtml('<b>"x" & \'y\'</b>')).toBe('&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;')
  })
})

describe('sanitizeContentForGuest', () => {
  it('drops prompts and model internals but keeps creative fields', () => {
    expect(
      sanitizeContentForGuest({
        url: 'https://x/img.png',
        headline: 'Hi',
        prompt_used: 'secret',
        negative_prompt: 'n',
        model: 'flux',
        provider: 'azure',
        width: 1024,
        drawing_notes: 'keep',
      })
    ).toEqual({ url: 'https://x/img.png', headline: 'Hi', width: 1024, drawing_notes: 'keep' })
    expect(sanitizeContentForGuest(null)).toEqual({})
  })
})
