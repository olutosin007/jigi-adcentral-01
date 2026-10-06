import { describe, expect, it } from 'vitest'
import { buildCompositeImageDescription, describeCompositeSources } from './composite'

const brief = {
  objective: 'Launch summer refresh',
  audience: 'Young professionals',
  channels: ['instagram_post'],
  key_message: 'Stay refreshed all summer',
}

const concept = {
  theme: 'Sunrise Energy',
  visual_direction: 'Golden hour lifestyle photography with cold drinks in soft light',
}

const copy = {
  headline: 'Wake up refreshed',
  key_message_delivery: 'Delivers daily hydration ritual',
  body: 'Start every morning with crisp, clean refreshment.',
  variant_label: 'Variant A',
}

describe('buildCompositeImageDescription', () => {
  it('I1: user override wins over concept and brief', () => {
    const result = buildCompositeImageDescription({
      brief,
      concept,
      copy,
      userOverride: 'A bottle on a marble table at dawn',
    })
    expect(result).toBe('A bottle on a marble table at dawn')
    expect(result).not.toContain('Golden hour')
  })

  it('I2: stacks visual direction, copy mood, and brief key message', () => {
    const result = buildCompositeImageDescription({ brief, concept, copy })
    expect(result).toContain('Golden hour lifestyle photography')
    expect(result).toContain('Wake up refreshed')
    expect(result).toContain('Stay refreshed all summer')
    expect(result).toContain('Launch summer refresh')
  })

  it('I3: concept visual_direction preferred over objective-only when no copy', () => {
    const result = buildCompositeImageDescription({ brief, concept })
    expect(result).toContain('Golden hour lifestyle photography')
    expect(result).toContain('Stay refreshed all summer')
    expect(result).not.toBe('Launch summer refresh')
  })

  it('I4: brief-only fallback when no concept or copy', () => {
    const result = buildCompositeImageDescription({ brief })
    expect(result).toContain('Stay refreshed all summer')
    expect(result).toContain('Launch summer refresh')
  })

  it('I5: seed idea used when idea-first and thin brief', () => {
    const result = buildCompositeImageDescription({
      seedIdea: 'A refreshing summer ritual',
    })
    expect(result).toContain('A refreshing summer ritual')
  })
})

describe('describeCompositeSources', () => {
  it('I6: labels concept + copy when both present', () => {
    const sources = describeCompositeSources({ concept, copy })
    expect(sources.label).toBe('Built from: Sunrise Energy + Variant A')
    expect(sources.hasConcept).toBe(true)
    expect(sources.hasCopy).toBe(true)
  })

  it('I7: labels brief only when no selections', () => {
    expect(describeCompositeSources({ brief }).label).toBe('Built from: brief only')
  })
})
