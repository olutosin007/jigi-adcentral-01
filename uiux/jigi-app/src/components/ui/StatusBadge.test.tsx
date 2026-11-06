import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'
import { STATUS_CONFIG } from '@/lib/status'
import { humanStatusLabel } from '@/lib/handoff'

describe('StatusBadge', () => {
  it.each(Object.keys(STATUS_CONFIG))('renders creator label for %s', (status) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(humanStatusLabel(status))).toBeInTheDocument()
  })

  it('renders client language when requested', () => {
    render(<StatusBadge status="submitted" audience="client" />)
    expect(screen.getByText('Needs your decision')).toBeInTheDocument()
  })

  it('falls back to Working for unknown status', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('Working')).toBeInTheDocument()
  })

  it('renders an icon alongside the label', () => {
    const { container } = render(<StatusBadge status="approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
