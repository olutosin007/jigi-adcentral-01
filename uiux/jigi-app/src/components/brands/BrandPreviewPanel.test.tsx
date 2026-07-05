import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrandPreviewPanel } from './BrandPreviewPanel'
import { deriveBrandEssentials, DEFAULT_BRAND_COLOURS, DEFAULT_BRAND_FONTS } from '@/lib/brand-profile-status'

describe('BrandPreviewPanel', () => {
  it('G3: renders headline in heading font and readiness score', () => {
    const identity = {
      colours: DEFAULT_BRAND_COLOURS,
      fonts: DEFAULT_BRAND_FONTS,
      visual_style: 'Warm lifestyle photography with natural light',
    }
    const voice = { tone: ['Bold', 'Warm'], preferred_words: [], avoided_words: [] }
    const essentials = deriveBrandEssentials(identity, voice)

    render(
      <BrandPreviewPanel
        brandName="Acme Co"
        identity={identity}
        voice={voice}
        essentials={essentials}
      />
    )

    expect(screen.getByText('Preview')).toBeInTheDocument()
    expect(screen.getByText('Acme Co')).toHaveStyle({ fontFamily: 'Fraunces' })
    expect(screen.getByLabelText(/of 6 brand essentials/i)).toHaveTextContent('4/6')
    expect(screen.getByText(/Warm lifestyle photography/i)).toBeInTheDocument()
  })
})
