import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandIncompleteBanner } from './BrandIncompleteBanner'
import { deriveBrandEssentials, DEFAULT_BRAND_COLOURS, DEFAULT_BRAND_FONTS } from '@/lib/brand-profile-status'

describe('BrandIncompleteBanner', () => {
  it('G1: renders when brand essentials are incomplete', () => {
    const essentials = deriveBrandEssentials(
      { colours: DEFAULT_BRAND_COLOURS, fonts: DEFAULT_BRAND_FONTS },
      { tone: [], preferred_words: [], avoided_words: [] }
    )

    render(
      <BrandIncompleteBanner essentials={essentials} onCompleteBrandKit={vi.fn()} />
    )

    expect(screen.getByText(/Brand profile incomplete — results may drift/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /complete brand kit/i })).toBeInTheDocument()
  })

  it('G2: renders nothing when brand is on-brand ready', () => {
    const essentials = deriveBrandEssentials(
      {
        colours: DEFAULT_BRAND_COLOURS,
        fonts: DEFAULT_BRAND_FONTS,
        logo_url: 'https://example.com/logo.png',
        visual_style: 'Warm lifestyle photography with natural light and diverse casting',
      },
      {
        tone: ['Bold'],
        preferred_words: ['craft', 'quality', 'trust'],
        avoided_words: [],
      }
    )

    const { container } = render(
      <BrandIncompleteBanner essentials={essentials} onCompleteBrandKit={vi.fn()} />
    )

    expect(container).toBeEmptyDOMElement()
  })
})
