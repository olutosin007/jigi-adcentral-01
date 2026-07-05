import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CampaignDetail } from './CampaignDetail'
import type { ReactNode } from 'react'

const mockCampaign = {
  id: 'camp-1',
  brand_id: 'brand-1',
  created_by: 'user-1',
  name: 'Test Campaign',
  brief: { objective: 'Test objective', audience: 'Youth', channels: ['instagram_post'] },
  journey_mode: 'brand_first' as 'brand_first' | 'idea_first',
  status: 'draft' as const,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' }, profile: { role: 'creator' } }),
}))

vi.mock('@/store/campaignStore', () => ({
  useCampaignStore: () => ({ updateCampaign: vi.fn().mockResolvedValue({ success: true }) }),
  CHANNEL_OPTIONS: [{ value: 'instagram_post', label: 'Instagram Post' }],
}))

vi.mock('@/hooks/useCampaignQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useCampaignQueries')>()
  return {
    ...actual,
    useCampaign: (id: string) => ({
      data: id ? mockCampaign : undefined,
      isLoading: false,
    }),
    useBrand: () => ({ data: { id: 'brand-1', name: 'Test Brand' } }),
    useCampaignAssets: () => ({ data: [] }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn() }),
    useSubmitAsset: () => ({ mutateAsync: vi.fn() }),
    useValidateAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
  }
})

vi.mock('@/components/generation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/generation')>()
  return {
    ...actual,
    GenerationPanel: ({
      onSubmitAsset,
      stage,
    }: {
      onSubmitAsset?: (assetId: string) => void
      stage?: string
    }) => (
      <div>
        <span data-testid="generation-stage">{stage}</span>
        <button type="button" onClick={() => onSubmitAsset?.('asset-from-panel')}>
          Panel Submit
        </button>
      </div>
    ),
  }
})

function createWrapper(initialEntry = '/app/campaigns/camp-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/app/campaigns/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('CampaignDetail page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders campaign name when loaded', () => {
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByRole('heading', { name: 'Test Campaign' })).toBeInTheDocument()
  })

  it('shows brand-grounded journey badge and primary CTA from pipeline gates', () => {
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByText('Brand-grounded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete brief' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit Brief' })).not.toBeInTheDocument()
  })

  it('shows idea-first badge when journey_mode is idea_first', () => {
    mockCampaign.journey_mode = 'idea_first'
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByText('Idea-first')).toBeInTheDocument()
    expect(screen.queryByText('Brand-grounded')).not.toBeInTheDocument()
    mockCampaign.journey_mode = 'brand_first'
  })

  it('renders pipeline rail instead of legacy tabs', () => {
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByRole('navigation', { name: 'Creative pipeline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Concepts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Images' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All assets' })).toBeInTheDocument()
    expect(screen.queryByText('Generated')).not.toBeInTheDocument()
  })

  it('shows brief snippet on non-brief stages', () => {
    render(<CampaignDetail />, { wrapper: createWrapper('/app/campaigns/camp-1?stage=concepts') })
    expect(screen.getByLabelText('Campaign brief summary')).toBeInTheDocument()
    expect(screen.getByText('Test objective')).toBeInTheDocument()
  })

  it('hides brief snippet on brief stage', () => {
    render(<CampaignDetail />, { wrapper: createWrapper('/app/campaigns/camp-1?stage=brief') })
    expect(screen.queryByLabelText('Campaign brief summary')).not.toBeInTheDocument()
    expect(screen.getByText('Campaign Brief')).toBeInTheDocument()
  })

  it('restores stage from URL search param', () => {
    render(<CampaignDetail />, { wrapper: createWrapper('/app/campaigns/camp-1?stage=copy') })
    expect(screen.getByTestId('generation-stage')).toHaveTextContent('copy')
  })

  it('renders back to campaigns link', () => {
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: /campaigns/i })).toBeInTheDocument()
  })

  it('passes onSubmitAsset to GenerationPanel on concepts stage', async () => {
    render(<CampaignDetail />, { wrapper: createWrapper('/app/campaigns/camp-1?stage=concepts') })
    expect(screen.getByRole('button', { name: 'Panel Submit' })).toBeInTheDocument()
  })

  it('switches pipeline stage on rail click', async () => {
    const user = userEvent.setup()
    render(<CampaignDetail />, { wrapper: createWrapper('/app/campaigns/camp-1?stage=concepts') })
    await user.click(screen.getByRole('button', { name: 'All assets' }))
    expect(screen.queryByTestId('generation-stage')).not.toBeInTheDocument()
  })
})
