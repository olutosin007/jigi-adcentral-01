import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CreativeAsset } from '@/store/campaignStore'
import { FixAndResendDialog } from './FixAndResendDialog'

const copyAsset = {
  id: 'a1',
  campaign_id: 'c1',
  type: 'copy',
  status: 'changes_requested',
  version: 1,
  source: 'uploaded',
  content: { headline: 'Old headline', body: 'Body', cta: 'Buy' },
  review_notes: 'Punchier headline please',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z',
} as unknown as CreativeAsset

describe('FixAndResendDialog', () => {
  it('pins client notes and resends only the edited fields as the next round', async () => {
    const onResend = vi.fn().mockResolvedValue(undefined)
    render(<FixAndResendDialog asset={copyAsset} round={1} onOpenChange={vi.fn()} onResend={onResend} isSending={false} />)

    expect(screen.getByRole('region', { name: 'What the client asked for' })).toHaveTextContent('Punchier headline please')
    expect(screen.getByTestId('no-revision-hint')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'New headline' } })
    fireEvent.change(screen.getByLabelText('Tell the client what changed'), { target: { value: 'Tightened it' } })
    expect(screen.queryByTestId('no-revision-hint')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Resend as Round 2' }))
    await waitFor(() =>
      expect(onResend).toHaveBeenCalledWith(copyAsset, {
        fields: { headline: 'New headline' },
        file: undefined,
        note: 'Tightened it',
      })
    )
  })

  it('offers a revised file upload for images', () => {
    const image = { ...copyAsset, type: 'image', content: { url: 'https://x/a.png' } } as unknown as CreativeAsset
    render(<FixAndResendDialog asset={image} round={2} onOpenChange={vi.fn()} onResend={vi.fn()} isSending={false} />)
    expect(screen.getByText('Upload revised file')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend as Round 3' })).toBeInTheDocument()
  })
})
