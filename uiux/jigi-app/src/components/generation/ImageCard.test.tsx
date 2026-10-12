import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ImageCard } from './ImageCard'
import type { ImageResult } from '@/lib/ai'

const baseImage: ImageResult = {
  url: 'https://example.com/a.png',
  prompt_used: 'Sunlit product shot on linen',
  model: 'kling-v3',
  image_tier: 'refine',
  aspect_ratio: '4:5',
  image_resolution: '1K',
}

describe('ImageCard', () => {
  it('shows Remix and Upscale when handlers are provided', () => {
    const onRemix = vi.fn()
    const onUpscale = vi.fn()
    render(<ImageCard image={baseImage} onRemix={onRemix} onUpscale={onUpscale} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remix' }))
    fireEvent.click(screen.getByRole('button', { name: 'Upscale 2×' }))
    expect(onRemix).toHaveBeenCalledTimes(1)
    expect(onUpscale).toHaveBeenCalledTimes(1)
  })

  it('hides Upscale on an already-upscaled image', () => {
    render(
      <ImageCard
        image={{ ...baseImage, upscaled_from: 'src-id', upscale_scale: 2 }}
        onUpscale={vi.fn()}
        version={2}
      />
    )
    expect(screen.queryByRole('button', { name: /Upscale/ })).not.toBeInTheDocument()
    expect(screen.getByTestId('image-version-badge')).toHaveTextContent('v2 · 2×')
  })

  it('disables Upscale while in flight', () => {
    render(<ImageCard image={baseImage} onUpscale={vi.fn()} isUpscaling />)
    expect(screen.getByRole('button', { name: 'Upscaling' })).toBeDisabled()
  })

  it('omits the version badge for v1', () => {
    render(<ImageCard image={baseImage} version={1} />)
    expect(screen.queryByTestId('image-version-badge')).not.toBeInTheDocument()
  })

  it('shows aspect and resolution instead of a fixed size', () => {
    render(<ImageCard image={baseImage} />)
    expect(screen.getByText('4:5 · 1K')).toBeInTheDocument()
  })

  it('keeps Submit for draft images', () => {
    const onSubmit = vi.fn()
    render(<ImageCard image={baseImage} status="draft" onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: /Submit/ }))
    expect(onSubmit).toHaveBeenCalled()
  })
})
