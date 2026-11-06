import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CopyDetailModal } from './CopyDetailModal'
import type { CopyResult } from '@/lib/ai'

describe('CopyDetailModal', () => {
  it('J7: shows compliance summary with parent concept theme', () => {
    const copy: CopyResult = {
      headline: 'Stay cool',
      body: 'Summer refresh copy.',
      cta: 'Buy now',
      mandatory_inclusions_check: [{ requirement: 'Include brand name', present: false }],
      exclusions_check: [{ exclusion: 'Competitor names', violated: true }],
    }

    render(
      <CopyDetailModal
        open
        onOpenChange={() => {}}
        copy={copy}
        parentConceptTheme="Golden Hour"
        channelMaxCharsHint={125}
      />
    )

    expect(screen.getByText('Compliance summary')).toBeInTheDocument()
    expect(screen.getByText('Golden Hour')).toBeInTheDocument()
    expect(screen.getByText('Include brand name')).toBeInTheDocument()
    expect(screen.getByText('Competitor names')).toBeInTheDocument()
  })
})
