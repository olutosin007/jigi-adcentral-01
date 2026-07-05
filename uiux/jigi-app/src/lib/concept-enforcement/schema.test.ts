import { describe, expect, it } from 'vitest'
import { normalizeConceptToDisplay } from './schema'

const prd06 = {
  concept_name: 'Real Magic',
  strategic_insight: 'People crave genuine connection',
  creative_territory: 'Warm shared moments',
  headline_direction: 'Share the magic',
  format_suitability: ['instagram_post'],
  key_message_link: 'Delivers togetherness via sharing',
  brand_alignment_score: 88,
  brand_alignment_rationale: 'Strong tie to positioning',
}

describe('normalizeConceptToDisplay', () => {
  it('maps the canonical PRD-06 schema (no display extras)', () => {
    const d = normalizeConceptToDisplay(prd06)
    expect(d.theme).toBe('Real Magic')
    expect(d.headlines).toEqual(['Share the magic'])
    expect(d.visual_direction).toBe('Warm shared moments')
    expect(d.brand_alignment_score).toBe(88)
  })

  it('prefers richer headlines + visual_direction when the hybrid schema supplies them', () => {
    const d = normalizeConceptToDisplay({
      ...prd06,
      theme: 'Share the Chill',
      headlines: ['One', 'Two', 'Three'],
      visual_direction: 'Condensation on an ice-cold bottle at the beach',
      rationale: 'Because summer',
    })
    expect(d.theme).toBe('Share the Chill')
    expect(d.headlines).toEqual(['One', 'Two', 'Three'])
    expect(d.visual_direction).toBe('Condensation on an ice-cold bottle at the beach')
    expect(d.rationale).toBe('Because summer')
    // enriched fields still preserved
    expect(d.brand_alignment_score).toBe(88)
    expect(d.key_message_link).toBe('Delivers togetherness via sharing')
  })

  it('handles the legacy schema unchanged', () => {
    const d = normalizeConceptToDisplay({
      theme: 'Legacy',
      headlines: ['a', 'b'],
      visual_direction: 'v',
      rationale: 'r',
    })
    expect(d.theme).toBe('Legacy')
    expect(d.headlines).toEqual(['a', 'b'])
    expect(d.brand_alignment_score).toBeUndefined()
  })
})
