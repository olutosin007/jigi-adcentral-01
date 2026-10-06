import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { OnBrandCheckPanel } from './OnBrandCheckPanel'

describe('OnBrandCheckPanel', () => {
  it('says plainly when no brand is attached', () => {
    render(<OnBrandCheckPanel asset={{}} kit="none" />)
    expect(screen.getByText(/no brand attached/i)).toBeInTheDocument()
    expect(screen.queryByTestId('on-brand-verdict')).not.toBeInTheDocument()
  })

  it('offers a run check when unchecked', () => {
    const onRunCheck = vi.fn()
    render(<OnBrandCheckPanel asset={{}} kit="complete" onRunCheck={onRunCheck} />)
    expect(screen.getByTestId('on-brand-verdict')).toHaveTextContent('Not checked')
    fireEvent.click(screen.getByRole('button', { name: /run check/i }))
    expect(onRunCheck).toHaveBeenCalled()
  })

  it('marks partial kits as guidance only', () => {
    render(
      <OnBrandCheckPanel
        asset={{ validation_scores: { valid: true, blocking: false, validated_at: '2026-10-01' } }}
        kit="partial"
      />
    )
    expect(screen.getByTestId('on-brand-verdict')).toHaveTextContent('No issues found')
    expect(screen.getByText(/guidance only/i)).toBeInTheDocument()
  })
})
