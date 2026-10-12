import { describe, expect, it } from 'vitest'
import {
  DIRECT_PROMPT_MAX,
  buildDirectCampaignPayload,
  deriveQuickCampaignName,
  directGenerateStage,
  parseDirectGenerateState,
  validateDirectPrompt,
} from './direct-generate'

describe('validateDirectPrompt', () => {
  it('requires a few characters and caps length', () => {
    expect(validateDirectPrompt('  ')).not.toBeNull()
    expect(validateDirectPrompt('ab')).not.toBeNull()
    expect(validateDirectPrompt('Cold brew')).toBeNull()
    expect(validateDirectPrompt('x'.repeat(DIRECT_PROMPT_MAX + 1))).not.toBeNull()
  })
})

describe('deriveQuickCampaignName', () => {
  it('uses the first words of the prompt', () => {
    expect(deriveQuickCampaignName('Sunlit bottle of cold brew on linen')).toBe(
      'Quick: Sunlit bottle of cold brew on linen'
    )
  })

  it('caps at 8 words / 60 chars on a word boundary and strips trailing punctuation', () => {
    const name = deriveQuickCampaignName('One two three four five six seven eight nine ten')
    expect(name).toBe('Quick: One two three four five six seven eight')
    const long = deriveQuickCampaignName('Supercalifragilisticexpialidocious '.repeat(4))
    expect(long.length).toBeLessThanOrEqual(60)
    expect(deriveQuickCampaignName('Cold brew,')).toBe('Quick: Cold brew')
  })

  it('collapses whitespace and handles empty input', () => {
    expect(deriveQuickCampaignName('  cold \n\n brew  ')).toBe('Quick: cold brew')
    expect(deriveQuickCampaignName('   ')).toBe('Quick creative')
  })
})

describe('buildDirectCampaignPayload', () => {
  it('creates a brandless idea-first campaign seeded with the prompt', () => {
    expect(buildDirectCampaignPayload('  Cold brew on linen ', 'user-1')).toEqual({
      name: 'Quick: Cold brew on linen',
      created_by: 'user-1',
      journey_mode: 'idea_first',
      seed_idea: 'Cold brew on linen',
      brief: { channels: [], reference_assets: [] },
    })
  })
})

describe('directGenerateStage', () => {
  it('maps kinds to pipeline stages', () => {
    expect(directGenerateStage('image')).toBe('images')
    expect(directGenerateStage('concepts')).toBe('concepts')
  })
})

describe('parseDirectGenerateState', () => {
  const valid = { kind: 'image', prompt: ' Cold brew ', imageTier: 'refine', aspectRatio: '9:16' }

  it('accepts a well-formed request and trims the prompt', () => {
    expect(parseDirectGenerateState({ directGenerate: valid })).toEqual({
      kind: 'image',
      prompt: 'Cold brew',
      imageTier: 'refine',
      aspectRatio: '9:16',
    })
  })

  it('rejects missing or malformed state', () => {
    expect(parseDirectGenerateState(null)).toBeNull()
    expect(parseDirectGenerateState({ idea: 'x' })).toBeNull()
    expect(parseDirectGenerateState({ directGenerate: { ...valid, kind: 'video' } })).toBeNull()
    expect(parseDirectGenerateState({ directGenerate: { ...valid, prompt: '' } })).toBeNull()
    expect(parseDirectGenerateState({ directGenerate: { ...valid, imageTier: 'ultra' } })).toBeNull()
    expect(parseDirectGenerateState({ directGenerate: { ...valid, aspectRatio: '3:2' } })).toBeNull()
  })
})
