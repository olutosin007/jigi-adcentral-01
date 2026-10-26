import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubmitModal } from './SubmitModal'

describe('SubmitModal Brand Guardian soft-gate', () => {
  it('requires a second click when guardian severity is fail', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <SubmitModal
        open
        onOpenChange={vi.fn()}
        assetName="Draft"
        assetType="image"
        onSubmit={onSubmit}
        isSubmitting={false}
        guardianSeverity="fail"
      />
    )

    expect(screen.getByTestId('brand-guardian-soft-gate')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Review issues/i }))
    expect(onSubmit).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /^Send$/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('submits immediately when severity is ok', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <SubmitModal
        open
        onOpenChange={vi.fn()}
        assetName="Draft"
        assetType="copy"
        onSubmit={onSubmit}
        isSubmitting={false}
        guardianSeverity="ok"
      />
    )

    expect(screen.queryByTestId('brand-guardian-soft-gate')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Send$/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
