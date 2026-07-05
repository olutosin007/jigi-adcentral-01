import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CopyCard } from './CopyCard'
import type { CopyResult } from '@/lib/ai'

describe('CopyCard', () => {
  it('J6: shows char budget, variant intent, and over-limit warning', () => {
    const copy: CopyResult = {
      headline: 'Stay refreshed all summer',
      body: 'A'.repeat(120),
      cta: 'Shop now',
      character_count: 150,
      variant_intent: 'Proof-led social hook',
      validation_warnings: ['Character count exceeds channel limit'],
    }

    render(<CopyCard copy={copy} channelMaxChars={125} showActions={false} variantLabel="Variant A" />)

    expect(screen.getByText('150 / 125')).toBeInTheDocument()
    expect(screen.getByText('Proof-led social hook')).toBeInTheDocument()
    expect(screen.getByText(/Character count exceeds channel limit/i)).toBeInTheDocument()
  })
})
