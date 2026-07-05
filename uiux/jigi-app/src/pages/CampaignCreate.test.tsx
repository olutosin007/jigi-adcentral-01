import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CampaignCreate } from './CampaignCreate'

const mockNavigate = vi.fn()
const mockCreateCampaign = vi.fn().mockResolvedValue({
  success: true,
  campaign: { id: 'camp-1', name: 'New Campaign' },
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('@/store/campaignStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/campaignStore')>()
  return {
    ...actual,
    useCampaignStore: () => ({
      createCampaign: mockCreateCampaign,
      updateCampaign: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
    }),
  }
})

vi.mock('@/store/brandStore', () => ({
  useBrandStore: () => ({
    brands: [{ id: 'brand-1', name: 'Test Brand' }],
    fetchBrands: vi.fn(),
  }),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderCampaignCreate(initialEntry = '/app/campaigns/new') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/app/campaigns/new" element={<CampaignCreate />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CampaignCreate page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockCreateCampaign.mockClear()
  })

  it('renders campaign name input', () => {
    renderCampaignCreate()
    expect(screen.getByLabelText(/campaign name/i)).toBeInTheDocument()
  })

  it('renders create button', () => {
    renderCampaignCreate()
    expect(screen.getByRole('button', { name: /create campaign/i })).toBeInTheDocument()
  })

  it('accepts input in campaign name field', async () => {
    const user = userEvent.setup()
    renderCampaignCreate()
    const nameInput = screen.getByLabelText(/campaign name/i)
    await user.type(nameInput, 'My New Campaign')
    expect(nameInput).toHaveValue('My New Campaign')
  }, 10_000)

  it('U1: navigates to campaign with ?stage=brief after create', async () => {
    const user = userEvent.setup()
    renderCampaignCreate('/app/campaigns/new?mode=idea_first')

    await user.type(screen.getByLabelText(/campaign name/i), 'Summer Launch 2026')
    await user.type(screen.getByLabelText(/your idea/i), 'A bold summer refresh campaign for youth audiences')
    await user.type(screen.getByLabelText(/key message/i), 'Refresh your summer')
    await user.click(screen.getByRole('checkbox', { name: /instagram post/i }))
    await user.click(screen.getByRole('button', { name: /create campaign/i }))

    expect(mockCreateCampaign).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/app/campaigns/camp-1?stage=brief')
  }, 15_000)
})
