import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CampaignDetail } from './CampaignDetail'
import type { ReactNode } from 'react'

const mockCampaign = {
  id: 'camp-1',
  brand_id: 'brand-1',
  created_by: 'user-1',
  name: 'Test Campaign',
  brief: { objective: 'Test', audience: 'Youth', channels: ['instagram_post'] },
  journey_mode: 'brand_first' as const,
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
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/store/campaignStore', () => ({
  useCampaignStore: () => ({ updateCampaign: vi.fn().mockResolvedValue({ success: true }) }),
  CHANNEL_OPTIONS: [],
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
  }
})

vi.mock('@/lib/api-client', () => ({
  generateCreativesViaRouter: vi.fn().mockResolvedValue({ jobId: 'job-1', variants: [] }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/app/campaigns/camp-1']}>
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

  it('renders Brief, Generated, All Assets tabs', () => {
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByText('Brief')).toBeInTheDocument()
    expect(screen.getByText('Generated')).toBeInTheDocument()
    expect(screen.getByText('All Assets')).toBeInTheDocument()
  })

  it('renders back to campaigns link', () => {
    render(<CampaignDetail />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: /campaigns/i })).toBeInTheDocument()
  })
})
