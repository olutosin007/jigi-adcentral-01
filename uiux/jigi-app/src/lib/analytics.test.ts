import { describe, expect, it, vi, beforeEach } from 'vitest'
import { trackGenerateImagePath } from './analytics'

describe('trackGenerateImagePath', () => {
  beforeEach(() => {
    vi.spyOn(window, 'dispatchEvent')
  })

  it('K3: dispatches generate_image with path', () => {
    trackGenerateImagePath('production_path', { campaign_id: 'camp-1', source: 'copy_card' })
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'jigi:analytics',
        detail: {
          event: 'generate_image',
          props: { path: 'production_path', campaign_id: 'camp-1', source: 'copy_card' },
        },
      })
    )
  })
})
