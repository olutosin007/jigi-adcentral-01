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
      expect(parsePipelineStage('send')).toBe('send')
      expect(parsePipelineStage('decisions')).toBe('decisions')
      expect(parsePipelineStage('approved')).toBe('approved')
    })

    it('aliases creative to the first creative step and rejects unknown stages', () => {
      expect(parsePipelineStage('creative')).toBe('concepts')
      expect(parsePipelineStage('nope')).toBe('brief')
    })
  })
})
