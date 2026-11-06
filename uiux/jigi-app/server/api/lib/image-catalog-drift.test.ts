/**
 * Drift guard: the client tier catalog shown to users must match what the
 * server actually routes to and what it costs.
 */
import { describe, expect, it } from 'vitest'
import { IMAGE_TIER_OPTIONS } from '../../../src/lib/image-tiers'
import { estimateImageCostUsd } from './image-models.js'
import {
  DEFAULT_GEMINI_MODEL_BY_TIER,
  DEFAULT_KLING_MODEL_BY_TIER,
  PRIMARY_PROVIDER_ORDER,
  RESOLUTION_BY_TIER,
} from './image-routing.js'

describe('client tier catalog ↔ server registry', () => {
  it('covers exactly the server tiers, in order', () => {
    expect(IMAGE_TIER_OPTIONS.map((t) => t.id)).toEqual(['draft', 'refine', 'final'])
  })

  for (const option of IMAGE_TIER_OPTIONS) {
    it(`${option.id}: model is the server's primary model`, () => {
      const primary = PRIMARY_PROVIDER_ORDER[option.id][0]
      const model =
        primary === 'kling' ? DEFAULT_KLING_MODEL_BY_TIER[option.id] : DEFAULT_GEMINI_MODEL_BY_TIER[option.id]
      expect(option.model).toBe(model)
    })

    it(`${option.id}: estimated cost equals the registry price at the tier resolution`, () => {
      expect(option.estCostUsd).toBe(estimateImageCostUsd(option.model, RESOLUTION_BY_TIER[option.id]))
    })
  }
})
