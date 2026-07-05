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

const mockDraftConceptAsset = {
  id: 'concept-1',
  campaign_id: 'camp-1',
  created_by: 'user-1',
  type: 'concept' as const,
  generation_mode: 'brand_grounded' as const,
  content: {
    theme: 'Summer Launch',
    headlines: ['Headline A'],
    visual_direction: 'Bright',
    rationale: 'Test',
  },
  version: 1,
  status: 'draft' as const,
  compliance_check: {},
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const { mockCampaignAssetsData, mockSelectConceptMutate, mockSelectCopyMutate } = vi.hoisted(() => ({
  mockCampaignAssetsData: { current: [] as typeof mockDraftConceptAsset[] },
  mockSelectConceptMutate: vi.fn().mockResolvedValue({}),
  mockSelectCopyMutate: vi.fn().mockResolvedValue({}),
}))

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
    useCampaignAssets: () => ({ data: mockCampaignAssetsData.current }),
    useDeleteAsset: () => ({ mutateAsync: vi.fn() }),
    useBrand: () => ({ data: undefined }),
    useSelectConcept: () => ({
      mutateAsync: mockSelectConceptMutate,
      isPending: false,
    }),
    useSelectCopy: () => ({
      mutateAsync: mockSelectCopyMutate,
      isPending: false,
    }),
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
    mockCampaignAssetsData.current = []
    mockSelectConceptMutate.mockClear()
    mockSelectCopyMutate.mockClear()
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
    expect(screen.getByRole('button', { name: 'Generate Concepts' })).toBeInTheDocument()
  })

  it('calls onSubmitAsset when Submit for Review is clicked on a draft concept', async () => {
    mockCampaignAssetsData.current = [mockDraftConceptAsset]
    const onSubmitAsset = vi.fn()
    const user = userEvent.setup()

    render(
      <GenerationPanel
        campaign={mockCampaign}
        brandId="brand-1"
        userId="user-1"
        onSubmitAsset={onSubmitAsset}
      />,
      { wrapper: createWrapper() }
    )

    await user.click(screen.getByRole('button', { name: /submit for review/i }))
    expect(onSubmitAsset).toHaveBeenCalledWith('concept-1')
  })

  it('U4: calls select concept hook when Use for copy & visuals is clicked', async () => {
    mockCampaignAssetsData.current = [mockDraftConceptAsset]
    const user = userEvent.setup()

    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" />,
      { wrapper: createWrapper() }
    )

    await user.click(screen.getByRole('button', { name: /use for copy & visuals/i }))
    expect(mockSelectConceptMutate).toHaveBeenCalledWith('concept-1')
    expect(screen.getByText('Concept for copy generation')).toBeInTheDocument()
  })

  it('shows concept selector on copy tab before any copy exists', async () => {
    mockCampaignAssetsData.current = [mockDraftConceptAsset]
    const user = userEvent.setup()

    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" stage="copy" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByText('Concept for copy generation')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Summer Launch' })).toBeInTheDocument()
    expect(screen.getByText('Generate your first copy')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Summer Launch' }))
    expect(screen.getByRole('button', { name: 'Generate copy' })).toBeInTheDocument()
  })

  it('U6: shows explore banner on Images tab when no copy selection', async () => {
    const user = userEvent.setup()
    render(
      <GenerationPanel campaign={mockCampaign} brandId="brand-1" userId="user-1" stage="images" />,
      { wrapper: createWrapper() }
    )

    expect(screen.getByTestId('images-explore-banner')).toBeInTheDocument()
    expect(
      screen.getByText(/for messaging-aligned key art, select copy first/i)
    ).toBeInTheDocument()

    await user.click(screen.getByText('Images'))
    expect(screen.getByTestId('images-explore-banner')).toBeInTheDocument()
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
