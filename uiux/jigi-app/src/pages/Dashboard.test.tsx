import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Dashboard } from './Dashboard'
import type { ReactNode } from 'react'

const { mockRole, mockPendingReview } = vi.hoisted(() => ({
  mockRole: { current: 'reviewer' as string },
  mockPendingReview: { current: 2 },
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
    profile: { name: 'Test User', role: mockRole.current },
  }),
}))

vi.mock('@/hooks/useDashboardQueries', () => ({
  useDashboardStats: () => ({
    data: {
      pendingReview: mockPendingReview.current,
      activeCampaigns: 1,
      approvedThisWeek: 0,
    },
    isLoading: false,
  }),
  usePendingReviews: () => ({ data: [], isLoading: false }),
  useRecentCampaigns: () => ({ data: [], isLoading: false }),
  useGenerationMixStats: () => ({ data: undefined, isLoading: false }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockRole.current = 'reviewer'
    mockPendingReview.current = 2
  })

  it('shows pending reviews widget before stats for reviewer role with pending count', () => {
    const { container } = render(<Dashboard />, { wrapper: createWrapper() })

    const pendingTitle = screen.getByText('Pending Your Review')
    const activeCampaignsStat = screen.getByText('Active Campaigns')

    const pendingIndex = Array.from(container.querySelectorAll('*')).indexOf(pendingTitle)
    const statsIndex = Array.from(container.querySelectorAll('*')).indexOf(activeCampaignsStat)

    expect(pendingIndex).toBeGreaterThan(-1)
    expect(statsIndex).toBeGreaterThan(-1)
    expect(pendingIndex).toBeLessThan(statsIndex)
  })

  it('shows recent campaigns before stats for creator role', () => {
    mockRole.current = 'creator'
    mockPendingReview.current = 0

    const { container } = render(<Dashboard />, { wrapper: createWrapper() })

    const recentTitle = screen.getByText('Recent Campaigns')
    const activeCampaignsStat = screen.getByText('Active Campaigns')

    const recentIndex = Array.from(container.querySelectorAll('*')).indexOf(recentTitle)
    const statsIndex = Array.from(container.querySelectorAll('*')).indexOf(activeCampaignsStat)

    expect(recentIndex).toBeGreaterThan(-1)
    expect(statsIndex).toBeGreaterThan(-1)
    expect(recentIndex).toBeLessThan(statsIndex)
  })
})
