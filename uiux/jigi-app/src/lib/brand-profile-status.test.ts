import { describe, it, expect } from 'vitest'
import { deriveBrandProfileStatus } from './brand-profile-status'

describe('deriveBrandProfileStatus', () => {
  it('returns starter when kit is empty', () => {
    expect(deriveBrandProfileStatus({}, {})).toBe('starter')
  })

  it('returns partial when only colors are set', () => {
    expect(
      deriveBrandProfileStatus({ colours: { primary: '#0D9488' } }, { tone: [] })
    ).toBe('partial')
  })

  it('returns complete when colors, fonts, and tone are sufficient', () => {
    expect(
      deriveBrandProfileStatus(
        {
          colours: { primary: '#0D9488' },
          fonts: { heading: 'Inter', body: 'Inter' },
        },
        { tone: ['Bold', 'Warm', 'Professional'] }
      )
    ).toBe('complete')
  })
})
