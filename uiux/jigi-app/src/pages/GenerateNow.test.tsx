import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { GenerateNow } from './GenerateNow'

const mockNavigate = vi.fn()
const mockCreateCampaign = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/campaignStore', () => ({
  useCampaignStore: () => ({ createCampaign: mockCreateCampaign }),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderPage(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/app/generate', state }]}>
      <GenerateNow />
    </MemoryRouter>
  )
}

describe('GenerateNow page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateCampaign.mockResolvedValue({ success: true, campaign: { id: 'camp-9' } })
  })

  it('needs no brand or brief — only a prompt', () => {
    renderPage()
    expect(screen.getByLabelText('What do you want to make?')).toBeInTheDocument()
    expect(screen.queryByText(/brand/i, { selector: 'label' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Create a campaign instead/ })).toHaveAttribute(
      'href',
      '/app/campaigns/new'
    )
  })

  it('names idea-first and brand kit in the supporting line', () => {
    renderPage()
    expect(screen.getByText(/Idea-first/i)).toBeInTheDocument()
    expect(screen.getByText(/brand kit/i)).toBeInTheDocument()
  })

  it('validates the prompt before creating anything', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^Generate/ }))
    expect(screen.getByText('Describe what you want to make')).toBeInTheDocument()
    expect(mockCreateCampaign).not.toHaveBeenCalled()
  })

  it('creates an idea-first campaign and lands in Images with the request', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('What do you want to make?'), {
      target: { value: 'Cold brew on linen' },
    })
    fireEvent.click(screen.getByRole('radio', { name: /Final/ }))
    fireEvent.click(screen.getByRole('radio', { name: /9:16/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Generate/ }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalled())
    expect(mockCreateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({ journey_mode: 'idea_first', seed_idea: 'Cold brew on linen', created_by: 'user-1' })
    )
    expect(mockCreateCampaign.mock.calls[0][0]).not.toHaveProperty('brand_id')
    expect(mockNavigate).toHaveBeenCalledWith('/app/campaigns/camp-9?stage=images', {
      state: {
        directGenerate: { kind: 'image', prompt: 'Cold brew on linen', imageTier: 'final', aspectRatio: '9:16' },
      },
    })
  })

  it('routes Concepts requests to the concepts stage and hides the image tier picker', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('radio', { name: /Concepts/ }))
    expect(screen.queryByTestId('tier-picker')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('What do you want to make?'), {
      target: { value: 'Cold brew on linen' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Generate/ }))
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        '/app/campaigns/camp-9?stage=concepts',
        expect.objectContaining({ state: expect.objectContaining({ directGenerate: expect.objectContaining({ kind: 'concepts' }) }) })
      )
    )
  })

  it('prefills from an idea passed in router state', () => {
    renderPage({ idea: 'Summer refresh' })
    expect(screen.getByLabelText('What do you want to make?')).toHaveValue('Summer refresh')
  })

  it('stays put and reports when the campaign cannot be created', async () => {
    mockCreateCampaign.mockResolvedValue({ success: false, error: 'RLS denied' })
    const { toast } = await import('sonner')
    renderPage()
    fireEvent.change(screen.getByLabelText('What do you want to make?'), {
      target: { value: 'Cold brew on linen' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^Generate/ }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('RLS denied'))
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
