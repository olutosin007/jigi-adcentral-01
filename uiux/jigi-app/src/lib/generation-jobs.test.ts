import { describe, expect, it } from 'vitest'
import { isVideoGenerationEnabled } from './generation-jobs'

describe('isVideoGenerationEnabled', () => {
  it('defaults off', () => {
    expect(isVideoGenerationEnabled({})).toBe(false)
  })

  it('is true only for explicit true/1', () => {
    expect(isVideoGenerationEnabled({ VIDEO_ENABLED: 'true' })).toBe(true)
    expect(isVideoGenerationEnabled({ VIDEO_ENABLED: '1' })).toBe(true)
    expect(isVideoGenerationEnabled({ VIDEO_ENABLED: 'false' })).toBe(false)
  })
})
