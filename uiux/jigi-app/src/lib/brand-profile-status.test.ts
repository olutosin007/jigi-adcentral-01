import { describe, it, expect } from 'vitest'
import {
  deriveBrandEssentials,
  deriveBrandProfileStatus,
  DEFAULT_BRAND_COLOURS,
  DEFAULT_BRAND_FONTS,
} from './brand-profile-status'

describe('deriveBrandEssentials', () => {
  it('E1: quick-create defaults score as starter (2/6)', () => {
    const result = deriveBrandEssentials(
      { colours: DEFAULT_BRAND_COLOURS, fonts: DEFAULT_BRAND_FONTS },
      { tone: [], preferred_words: [], avoided_words: [] }
    )
    expect(result.score).toBe(2)
    expect(result.status).toBe('starter')
    expect(result.missing).toContain('At least 1 tone descriptor')
    expect(result.missing).toContain('Visual style description')
  })

  it('E2: complete kit scores 5–6 as complete status', () => {
    const result = deriveBrandEssentials(
      {
        colours: DEFAULT_BRAND_COLOURS,
        fonts: DEFAULT_BRAND_FONTS,
        logo_url: 'https://example.com/logo.png',
        visual_style: 'Warm lifestyle photography with natural light and diverse casting',
      },
      {
        tone: ['Bold'],
        preferred_words: ['refresh', 'discover', 'together'],
        avoided_words: [],
      }
    )
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.status).toBe('complete')
    expect(result.missing).toHaveLength(0)
  })

  it('E3: partial when 3–4 essentials met', () => {
    const result = deriveBrandEssentials(
      {
        colours: DEFAULT_BRAND_COLOURS,
        fonts: DEFAULT_BRAND_FONTS,
      },
      { tone: ['Professional'], preferred_words: [], avoided_words: [] }
    )
    expect(result.score).toBe(3)
    expect(result.status).toBe('partial')
  })
})

describe('deriveBrandProfileStatus', () => {
  it('returns starter when kit is empty', () => {
    expect(deriveBrandProfileStatus({}, {})).toBe('starter')
  })

  it('returns partial when only colors and fonts are set', () => {
    expect(
      deriveBrandProfileStatus(
        { colours: DEFAULT_BRAND_COLOURS, fonts: DEFAULT_BRAND_FONTS },
        { tone: [] }
      )
    ).toBe('starter')
  })

  it('returns complete when essentials score is ready', () => {
    expect(
      deriveBrandProfileStatus(
        {
          colours: DEFAULT_BRAND_COLOURS,
          fonts: DEFAULT_BRAND_FONTS,
          logo_url: 'https://example.com/logo.png',
          visual_style: 'Minimal product photography on warm cream backgrounds',
        },
        {
          tone: ['Bold', 'Warm'],
          preferred_words: ['craft', 'quality', 'trust'],
          avoided_words: [],
        }
      )
    ).toBe('complete')
  })
})
