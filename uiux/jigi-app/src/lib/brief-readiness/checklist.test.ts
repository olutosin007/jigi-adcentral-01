import { describe, expect, it } from 'vitest'
import { buildBriefChecklistItems, buildCreateChecklistItems } from './checklist'

describe('brief readiness checklist helpers', () => {
  it('D1: create checklist tracks name and idea-first seed idea', () => {
    const items = buildCreateChecklistItems({
      name: 'Summer Launch',
      objective: 'Launch summer refresh campaign',
      audience: 'Young professionals aged 25-35',
      channels: ['instagram_post'],
      keyMessage: 'Stay refreshed',
      seedIdea: 'Bold beach campaign for sunscreen',
      journeyMode: 'idea_first',
    })
    expect(items.find((i) => i.label === 'Campaign name')?.done).toBe(true)
    expect(items.find((i) => i.label === 'Your idea')?.done).toBe(true)
    expect(items.every((i) => i.done)).toBe(true)
  })

  it('D2: brief stage checklist includes brand for brand-first', () => {
    const items = buildBriefChecklistItems(
      {
        objective: 'Launch summer refresh campaign',
        audience: 'Young professionals aged 25-35',
        channels: ['instagram_post'],
        key_message: 'Stay refreshed',
      },
      { journey_mode: 'brand_first', seed_idea: null, brand_id: 'brand-1' }
    )
    expect(items.find((i) => i.label === 'Brand selected')?.done).toBe(true)
  })
})
