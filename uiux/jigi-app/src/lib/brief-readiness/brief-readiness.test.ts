import { describe, expect, it } from 'vitest'
import { evaluateBriefReadiness } from './index'

const completeBrief = {
  objective: 'Launch summer campaign for refresh',
  audience: 'Young professionals aged 25 to 35',
  channels: ['instagram_post'],
  key_message: 'Stay refreshed all summer long',
}

describe('evaluateBriefReadiness', () => {
  it('B1: missing key_message is not ready', () => {
    const result = evaluateBriefReadiness(
      { ...completeBrief, key_message: '' },
      { journey_mode: 'brand_first' }
    )
    expect(result.ready).toBe(false)
    expect(result.missing).toContain('Key message')
  })

  it('B2: all required brand-first fields are ready', () => {
    const result = evaluateBriefReadiness(completeBrief, { journey_mode: 'brand_first' })
    expect(result.ready).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('B3: idea-first requires seed_idea', () => {
    const result = evaluateBriefReadiness(completeBrief, {
      journey_mode: 'idea_first',
      seed_idea: 'Short',
    })
    expect(result.ready).toBe(false)
    expect(result.missing).toContain('Your idea')

    const ready = evaluateBriefReadiness(completeBrief, {
      journey_mode: 'idea_first',
      seed_idea: 'A beach vacation vibe for sunscreen launch',
    })
    expect(ready.ready).toBe(true)
  })

  it('returns warnings for optional empty fields', () => {
    const result = evaluateBriefReadiness(completeBrief, { journey_mode: 'brand_first' })
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})
