import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UploadCanvas, CreativeModeToggle } from './UploadCanvas'

const uploadMutate = vi.fn()
const copyMutate = vi.fn()

vi.mock('@/hooks/useCampaignQueries', () => ({
  useUploadAsset: () => ({ mutateAsync: uploadMutate }),
  useCreateUploadedCopy: () => ({ mutateAsync: copyMutate }),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function drop(files: File[]) {
  const input = screen.getByTestId('upload-input') as HTMLInputElement
  fireEvent.change(input, { target: { files } })
}

describe('UploadCanvas', () => {
  beforeEach(() => {
    uploadMutate.mockReset().mockResolvedValue({})
    copyMutate.mockReset().mockResolvedValue({})
  })

  it('queues multiple files and uploads each with inferred type', async () => {
    render(<UploadCanvas campaignId="c1" userId="u1" defaultType="image" uploadedAssets={[]} />)
    drop([
      new File(['x'], 'hero.png', { type: 'image/png' }),
      new File(['deck'], 'deck.pdf', { type: 'application/pdf' }),
    ])
    expect(screen.getByText('hero.png')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /add 2 to job/i }))
    await waitFor(() => expect(uploadMutate).toHaveBeenCalledTimes(2))
    expect(uploadMutate.mock.calls[0][0]).toMatchObject({ type: 'image', campaignId: 'c1' })
    expect(uploadMutate.mock.calls[1][0]).toMatchObject({ type: 'concept' })
  })

  it('rejects unsupported files with an actionable error', () => {
    render(<UploadCanvas campaignId="c1" userId="u1" defaultType="image" uploadedAssets={[]} />)
    drop([new File(['v'], 'clip.mp4', { type: 'video/mp4' })])
    expect(screen.getByText('File type not supported')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /nothing to add/i })).toBeDisabled()
  })

  it('lets the user choose type for ambiguous text files', async () => {
    render(<UploadCanvas campaignId="c1" userId="u1" defaultType="image" uploadedAssets={[]} />)
    drop([new File(['Headline\nBody'], 'lines.txt', { type: 'text/plain' })])
    const select = screen.getByLabelText('Type for lines.txt') as HTMLSelectElement
    expect(select.value).toBe('copy')
    fireEvent.click(screen.getByRole('button', { name: /add 1 to job/i }))
    await waitFor(() => expect(copyMutate).toHaveBeenCalled())
  })

  it('adds pasted copy', async () => {
    render(<UploadCanvas campaignId="c1" userId="u1" defaultType="copy" uploadedAssets={[]} />)
    fireEvent.change(screen.getByLabelText(/or paste copy/i), { target: { value: 'Big line' } })
    fireEvent.click(screen.getByRole('button', { name: /add copy/i }))
    await waitFor(() =>
      expect(copyMutate).toHaveBeenCalledWith({ campaignId: 'c1', userId: 'u1', text: 'Big line' })
    )
  })
})

describe('CreativeModeToggle', () => {
  it('gives Generate and Upload equal radio semantics', () => {
    const onChange = vi.fn()
    render(<CreativeModeToggle mode="generate" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: 'Generate' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Upload' }))
    expect(onChange).toHaveBeenCalledWith('upload')
  })
})
