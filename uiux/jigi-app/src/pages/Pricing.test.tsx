import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Pricing } from './Pricing'

describe('Pricing', () => {
  it('renders Studio / Agency / Brand placeholder prices and signup CTAs', () => {
    render(
      <MemoryRouter>
        <Pricing />
      </MemoryRouter>
    )
    expect(screen.getByTestId('pricing-tier-studio')).toHaveTextContent('$49')
    expect(screen.getByTestId('pricing-tier-agency')).toHaveTextContent('$199')
    expect(screen.getByTestId('pricing-tier-brand')).toHaveTextContent('$399')
    expect(screen.getAllByRole('link', { name: /Start free/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Generation compute may be metered/i)).toBeInTheDocument()
  })
})
