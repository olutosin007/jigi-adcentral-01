import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompareToPrevious } from './CompareToPrevious'

describe('CompareToPrevious', () => {
  it('shows images side by side', () => {
    render(
      <CompareToPrevious
        asset={{ type: 'image', content: { url: 'https://x/new.png' } }}
        previousContent={{ url: 'https://x/old.png' }}
        round={2}
      />
    )
    expect(screen.getByAltText('Round 1')).toHaveAttribute('src', 'https://x/old.png')
    expect(screen.getByAltText('Round 2 · now')).toHaveAttribute('src', 'https://x/new.png')
  })

  it('says when nothing changed in copy', () => {
    render(<CompareToPrevious asset={{ type: 'copy', content: { headline: 'Same' } }} previousContent={{ headline: 'Same' }} round={3} />)
    expect(screen.getByTestId('compare-fields')).toHaveTextContent('No text changes since Round 2')
  })
})
