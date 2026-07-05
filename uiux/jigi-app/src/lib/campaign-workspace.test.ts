import { describe, expect, it } from 'vitest'
import { parsePipelineStage } from './campaign-workspace'

describe('campaign-workspace', () => {
  describe('parsePipelineStage', () => {
    it('U7: defaults to brief when stage param is missing', () => {
      expect(parsePipelineStage(null)).toBe('brief')
      expect(parsePipelineStage(undefined)).toBe('brief')
      expect(parsePipelineStage('')).toBe('brief')
    })

    it('returns explicit valid stages', () => {
      expect(parsePipelineStage('concepts')).toBe('concepts')
      expect(parsePipelineStage('copy')).toBe('copy')
      expect(parsePipelineStage('images')).toBe('images')
      expect(parsePipelineStage('assets')).toBe('assets')
    })
  })
})
