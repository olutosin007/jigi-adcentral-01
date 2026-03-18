import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Campaigns } from './Campaigns'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/store/campaignStore', () => ({
  useCampaignStore: vi.fn(() => ({
    campaigns: [
      {
        id: 'camp-1',
        brand_id: 'brand-1',
        name: 'Summer Campaign',
        status: 'draft',
        journey_mode: 'brand_first',
        created_at: '2024-01-01T00:00:00Z',
        seed_idea: null,
      },
    ],
    isLoading: false,
    fetchCampaigns: vi.fn(),
  })),
  CAMPAIGN_STATUS_OPTIONS: [
    { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  ],
}))

vi.mock('@/store/brandStore', () => ({
  useBrandStore: vi.fn(() => ({
    brands: [{ id: 'brand-1', name: 'Test Brand' }],
    fetchBrands: vi.fn(),
  })),
}))

function renderCampaigns() {
  return render(
    <MemoryRouter>
      <Campaigns />
    </MemoryRouter>
  )
}

describe('Campaigns page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders campaigns list', () => {
    renderCampaigns()
    expect(screen.getByText('Campaigns')).toBeInTheDocument()
    expect(screen.getByText('Summer Campaign')).toBeInTheDocument()
    expect(screen.getByText('Test Brand')).toBeInTheDocument()
  })

  it('renders New campaign button', () => {
    renderCampaigns()
    const btn = screen.getByRole('button', { name: /new campaign/i })
    expect(btn).toBeInTheDocument()
  })

  it('navigates to new campaign on New campaign click', async () => {
    const user = userEvent.setup()
    renderCampaigns()
    const btn = screen.getByRole('button', { name: /new campaign/i })
    await user.click(btn)
    expect(mockNavigate).toHaveBeenCalledWith('/app/campaigns/new')
  })

  it('navigates to campaign detail on card click', async () => {
    const user = userEvent.setup()
    renderCampaigns()
    const card = screen.getByText('Summer Campaign').closest('[class*="cursor-pointer"]')
    if (card) await user.click(card as HTMLElement)
    expect(mockNavigate).toHaveBeenCalledWith('/app/campaigns/camp-1')
  })
})
