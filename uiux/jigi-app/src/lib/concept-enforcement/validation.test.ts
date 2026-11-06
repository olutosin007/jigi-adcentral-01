import { describe, expect, it } from 'vitest'
import { normalizeConceptToDisplay } from './schema'
import { validateConcept } from './validation'

describe('normalizeConceptToDisplay idea-first parity', () => {
  it('I1: defaults key_message_link from rationale when omitted', () => {
    const d = normalizeConceptToDisplay({
      theme: 'Sunrise Energy',
      headlines: ['Wake up refreshed'],
      visual_direction: 'Golden hour lifestyle',
      rationale: 'Connects morning ritual to refresh promise',
    })
    expect(d.key_message_link).toBe('Connects morning ritual to refresh promise')
  })

  it('I2: prefers explicit key_message_link over rationale', () => {
    const d = normalizeConceptToDisplay({
      theme: 'Poolside Cool',
      headlines: ['Dive in'],
      visual_direction: 'Bright pool scenes',
      key_message_link: 'Delivers refresh via summer escape',
      rationale: 'Because summer vibes',
    })
    expect(d.key_message_link).toBe('Delivers refresh via summer escape')
  })
})

describe('validateConcept idea-first key message checks', () => {
  it('I3: warns when key_message_link is empty after normalization', () => {
    const concept = normalizeConceptToDisplay({
      theme: 'Thin Concept',
      headlines: ['Hello'],
      visual_direction: 'Generic stock photo',
      rationale: '',
    })
    const result = validateConcept(concept, { keyMessage: 'Stay refreshed all summer' })
    expect(result.warnings.some((w) => w.includes('key_message_link is empty'))).toBe(true)
    expect(result.valid).toBe(false)
  })

  it('I4: warns when key_message_link does not reference the brief key message', () => {
    const concept = normalizeConceptToDisplay({
      theme: 'Off Brief',
      headlines: ['Buy now'],
      visual_direction: 'Product on white',
      rationale: 'Generic product push with no brief tie-in',
    })
    const result = validateConcept(concept, { keyMessage: 'Stay refreshed all summer' })
    expect(result.warnings.some((w) => w.includes('may not semantically reference'))).toBe(true)
  })

  it('I5: passes when explicit key_message_link references the key message', () => {
    const concept = normalizeConceptToDisplay({
      theme: 'Refresh Ritual',
      headlines: ['Stay cool'],
      visual_direction: 'Ice-cold bottle in sun',
      key_message_link: 'Stay refreshed all summer through daily hydration ritual',
      rationale: 'Ties product to summer refresh promise',
    })
    const result = validateConcept(concept, { keyMessage: 'Stay refreshed all summer' })
    expect(result.warnings.filter((w) => w.includes('key_message_link'))).toHaveLength(0)
    expect(result.valid).toBe(true)
  })
})
