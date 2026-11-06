import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TierPicker } from './TierPicker'
import { IMAGE_ASPECT_OPTIONS, IMAGE_TIER_OPTIONS, formatCostUsd } from '@/lib/image-tiers'

function renderPicker(overrides: Partial<Parameters<typeof TierPicker>[0]> = {}) {
  const props = {
    tier: 'draft' as const,
    onTierChange: vi.fn(),
    aspectRatio: '1:1' as const,
    onAspectRatioChange: vi.fn(),
    ...overrides,
  }
  render(<TierPicker {...props} />)
  return props
}

describe('TierPicker', () => {
  it('renders one radio per catalog tier with label and cost (drift guard)', () => {
    renderPicker()
    const group = screen.getByRole('radiogroup', { name: 'Image quality tier' })
    const radios = within(group).getAllByRole('radio')
    expect(radios).toHaveLength(IMAGE_TIER_OPTIONS.length)
    IMAGE_TIER_OPTIONS.forEach((option, i) => {
      expect(radios[i]).toHaveTextContent(option.label)
      expect(radios[i]).toHaveTextContent(formatCostUsd(option.estCostUsd))
      expect(radios[i]).toHaveTextContent(option.modelLabel)
    })
  })

  it('marks the selected tier and only it as checked + tabbable', () => {
    renderPicker({ tier: 'refine' })
    const group = screen.getByRole('radiogroup', { name: 'Image quality tier' })
    const checked = within(group).getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')
    expect(checked).toHaveLength(1)
    expect(checked[0]).toHaveTextContent('Refine')
    expect(checked[0]).toHaveAttribute('tabindex', '0')
  })

  it('calls onTierChange on click', () => {
    const props = renderPicker()
    fireEvent.click(screen.getByRole('radio', { name: /Final/ }))
    expect(props.onTierChange).toHaveBeenCalledWith('final')
  })

  it('supports arrow-key navigation with wraparound', () => {
    const props = renderPicker({ tier: 'draft' })
    const group = screen.getByRole('radiogroup', { name: 'Image quality tier' })
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(props.onTierChange).toHaveBeenLastCalledWith('refine')
    fireEvent.keyDown(group, { key: 'ArrowLeft' })
    expect(props.onTierChange).toHaveBeenLastCalledWith('final')
  })

  it('renders every supported aspect ratio and reports changes', () => {
    const props = renderPicker()
    const group = screen.getByRole('radiogroup', { name: 'Aspect ratio' })
    expect(within(group).getAllByRole('radio')).toHaveLength(IMAGE_ASPECT_OPTIONS.length)
    fireEvent.click(within(group).getByRole('radio', { name: /9:16/ }))
    expect(props.onAspectRatioChange).toHaveBeenCalledWith('9:16')
  })

  it('ignores input when disabled', () => {
    const props = renderPicker({ disabled: true })
    fireEvent.click(screen.getByRole('radio', { name: /Final/ }))
    fireEvent.keyDown(screen.getByRole('radiogroup', { name: 'Image quality tier' }), { key: 'ArrowRight' })
    expect(props.onTierChange).not.toHaveBeenCalled()
  })
})
