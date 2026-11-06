import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrandPresetBar } from './BrandPresetBar'
import type { BrandImagePreset } from '@/lib/brand-presets'

const presetsData: { current: BrandImagePreset[] } = { current: [] }
const createMutate = vi.fn()
const deleteMutate = vi.fn()

vi.mock('@/hooks/useBrandPresets', () => ({
  useBrandPresets: () => ({ data: presetsData.current }),
  useCreateBrandPreset: () => ({ mutateAsync: createMutate, isPending: false }),
  useDeleteBrandPreset: () => ({ mutateAsync: deleteMutate, isPending: false }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const preset: BrandImagePreset = {
  id: 'p1',
  brand_id: 'b1',
  name: 'Sunlit linen',
  style_prompt: 'linen textures',
  image_tier: 'final',
  aspect_ratio: '4:5',
  created_by: 'u1',
  created_at: '2026-10-12T00:00:00Z',
  updated_at: '2026-10-12T00:00:00Z',
}

function renderBar(overrides: Partial<Parameters<typeof BrandPresetBar>[0]> = {}) {
  const props = {
    brandId: 'b1',
    userId: 'u1',
    prompt: 'Bottle on a table',
    tier: 'refine' as const,
    aspectRatio: '1:1' as const,
    onApply: vi.fn(),
    ...overrides,
  }
  render(<BrandPresetBar {...props} />)
  return props
}

describe('BrandPresetBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    presetsData.current = [preset]
    createMutate.mockResolvedValue(preset)
  })

  it('is hidden when there is no brand', () => {
    renderBar({ brandId: undefined })
    expect(screen.queryByTestId('brand-preset-bar')).not.toBeInTheDocument()
  })

  it('renders chips and applies on click', () => {
    const props = renderBar()
    fireEvent.click(screen.getByRole('button', { name: /^Sunlit linen/ }))
    expect(props.onApply).toHaveBeenCalledWith(preset)
  })

  it('only the creator sees the remove control', () => {
    renderBar({ userId: 'someone-else' })
    expect(screen.queryByRole('button', { name: 'Remove Sunlit linen' })).not.toBeInTheDocument()
  })

  it('validates the name before saving', async () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Save current look/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Save look' }))
    expect(await screen.findByText('Give the look a name')).toBeInTheDocument()
    expect(createMutate).not.toHaveBeenCalled()
  })

  it('saves the current tier, aspect and style', async () => {
    renderBar({ prompt: 'Bottle\n\nStyle: neon noir', tier: 'draft', aspectRatio: '9:16' })
    fireEvent.click(screen.getByRole('button', { name: /Save current look/ }))
    fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Night' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save look' }))
    await waitFor(() =>
      expect(createMutate).toHaveBeenCalledWith({
        input: { name: 'Night', style_prompt: 'neon noir', image_tier: 'draft', aspect_ratio: '9:16' },
        userId: 'u1',
      })
    )
  })

  it('disables save when the prompt is empty', () => {
    renderBar({ prompt: '  ' })
    expect(screen.getByRole('button', { name: /Save current look/ })).toBeDisabled()
  })
})
