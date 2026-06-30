import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'
import { STATUS_CONFIG } from '@/lib/status'

describe('StatusBadge', () => {
  it.each(Object.keys(STATUS_CONFIG))('renders configured label for %s', (status) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
    render(<StatusBadge status={status} />)
    expect(screen.getByText(config.label)).toBeInTheDocument()
  })

  it('falls back to Draft for unknown status', () => {
    render(<StatusBadge status="unknown_status" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('renders an icon alongside the label', () => {
    const { container } = render(<StatusBadge status="approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
