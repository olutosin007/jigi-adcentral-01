import { describe, expect, it } from 'vitest'
import {
  countCopyDisplayChars,
  normalizeCopyToDisplay,
} from './schema'

describe('normalizeCopyToDisplay', () => {
  it('maps legacy flat headline, body, cta', () => {
    const r = normalizeCopyToDisplay({
      headline: 'H',
      body: 'B',
      cta: 'C',
    })
    expect(r).toMatchObject({
      headline: 'H',
      body: 'B',
      cta: 'C',
      character_count: 3,
    })
    expect(r.variant_label).toBeUndefined()
  })

  it('flattens nested content and maps channel_id to channel', () => {
    const r = normalizeCopyToDisplay({
      variant_label: 'A',
      channel_id: 'meta_feed',
      deliverable_type: 'social_feed',
      key_message: 'One line',
      content: {
        headline: 'H',
        body: 'Body',
        cta: 'Shop',
        cta_alternates: ['Learn more'],
        primary_text: 'Long',
      },
      mandatory_inclusions_check: [],
      exclusions_check: [],
      legal_disclaimers_appended: false,
    })
    expect(r.channel).toBe('meta_feed')
    expect(r.headline).toBe('H')
    expect(r.body).toBe('Body')
    expect(r.cta).toBe('Shop')
    expect(r.cta_alternates).toEqual(['Learn more'])
    expect(r.primary_text).toBe('Long')
    expect(r.key_message_delivery).toBe('One line')
    expect(r.mandatory_inclusions_check).toEqual([])
    expect(r.legal_disclaimers_appended).toBe(false)
    expect(typeof r.character_count).toBe('number')
    expect(r.character_count).toBeGreaterThan(3)
  })

  it('coerces key_message_delivery alias', () => {
    const r = normalizeCopyToDisplay({
      key_message_delivery: 'KM',
      content: { headline: 'a', body: 'b', cta: 'c' },
    })
    expect(r.key_message_delivery).toBe('KM')
  })

  it('coerces inclusion and exclusion rows', () => {
    const r = normalizeCopyToDisplay({
      content: { headline: 'h', body: 'b', cta: 'c' },
      mandatory_inclusions_check: [
        { requirement: 'Brand name', present: true },
      ],
      exclusions_check: [{ exclusion: 'cheap', violated: false }],
    })
    expect(r.mandatory_inclusions_check?.[0]).toEqual({
      requirement: 'Brand name',
      present: true,
    })
    expect(r.exclusions_check?.[0]).toEqual({
      exclusion: 'cheap',
      violated: false,
    })
  })

  it('normalizes tone_adherence from 0–1 fractional to 0–100', () => {
    const r = normalizeCopyToDisplay({
      content: { headline: 'h', body: 'b', cta: 'c' },
      tone_adherence: 0.85,
    })
    expect(r.tone_adherence).toBe(85)
  })

  it('preserves validation_warnings and exclusions_violated from rich variant JSON', () => {
    const r = normalizeCopyToDisplay({
      content: { headline: 'h', body: 'b', cta: 'c' },
      validation_warnings: ['Model note A', 'Model note B'],
      exclusions_violated: true,
    })
    expect(r.validation_warnings).toEqual(['Model note A', 'Model note B'])
    expect(r.exclusions_violated).toBe(true)
  })
})

describe('countCopyDisplayChars', () => {
  it('includes suite fields when present', () => {
    const n = countCopyDisplayChars({
      headline: 'ab',
      body: 'c',
      cta: 'd',
      primary_text: 'ef',
      key_message_delivery: 'msg',
    })
    expect(n).toBe(2 + 1 + 1 + 2 + 3)
  })
})
