import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConceptCard } from './ConceptCard'
import type { ConceptResult } from '@/lib/ai'

const baseConcept: ConceptResult = {
  theme: 'Golden Hour',
  headlines: ['Chase the light'],
  visual_direction: 'Warm sunset lifestyle photography',
  rationale: 'Evokes summer optimism',
  key_message_link: 'Delivers refresh promise through golden-hour energy',
}

describe('ConceptCard', () => {
  it('I6: shows key_message_link snippet when present', () => {
    render(<ConceptCard concept={baseConcept} showActions={false} />)
    expect(screen.getByText('Key message link')).toBeInTheDocument()
    expect(screen.getByText(/Delivers refresh promise through golden-hour energy/i)).toBeInTheDocument()
  })
})
