import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GenerationPanel } from './GenerationPanel'
import type { Campaign } from '@/store/campaignStore'
import type { ReactNode } from 'react'

const mockCampaign: Campaign = {
  id: 'camp-1',
  brand_id: 'brand-1',
  created_by: 'user-1',
  name: 'Test Campaign',
  brief: {
    objective: 'Launch campaign',
    audience: 'Youth',
    channels: ['instagram_post'],
  },
  journey_mode: 'brand_first',
  generation_mode: 'brand_grounded',
  status: 'draft',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

vi.mock('@/hooks/useCampaignQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useCampaignQueries')>()
  return {
    ...actual,
    useGenerateConcepts: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      reset: vi.fn(),
    }),
    useGenerateCopy: () => ({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      reset: vi.fn(),
    }),
    useGenerateImage: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ image: {} }),
      isPending: false,
      isError: false,
      reset: vi.fn(),
    }),
    useCampaignAssets: () => ({ data: [] }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn() }),
  }
})

vi.mock('@/lib/api-client', () => ({
  generateText: vi.fn().mockResolvedValue({ content: { refined_prompt: 'Refined' } }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('GenerationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders Concepts, Copy, Images tabs', () => {
    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByText('Concepts')).toBeInTheDocument()
    expect(screen.getByText('Copy')).toBeInTheDocument()
    expect(screen.getByText('Images')).toBeInTheDocument()
  })

  it('renders prompt textarea', () => {
    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" />,
      { wrapper: createWrapper() }
    )
    const textarea = screen.getByPlaceholderText(/describe your campaign/i)
    expect(textarea).toBeInTheDocument()
  })

  it('renders Generate button', () => {
    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" />,
      { wrapper: createWrapper() }
    )
    expect(screen.getByRole('button', { name: /generate concepts/i })).toBeInTheDocument()
  })

  it('shows Images tab content when Images tab is selected', async () => {
    const user = userEvent.setup()
    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" />,
      { wrapper: createWrapper() }
    )
    await user.click(screen.getByText('Images'))
    expect(screen.getByRole('button', { name: /generate image/i })).toBeInTheDocument()
  })
})
