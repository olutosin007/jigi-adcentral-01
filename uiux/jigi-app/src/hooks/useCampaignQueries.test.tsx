import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCampaign, useCampaignAssets, useBrand, useReviewQueue } from './useCampaignQueries'
import type { ReactNode } from 'react'

const mockCampaign = {
  id: 'camp-1',
  brand_id: 'brand-1',
  created_by: 'user-1',
  name: 'Test Campaign',
  brief: {},
  journey_mode: 'brand_first' as const,
  status: 'draft' as const,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
}

const mockAssets = [
  {
    id: 'asset-1',
    campaign_id: 'camp-1',
    created_by: 'user-1',
    type: 'concept' as const,
    generation_mode: 'brand_grounded' as const,
    content: { theme: 'Test', headlines: [], visual_direction: '', rationale: '' },
    version: 1,
    status: 'draft' as const,
    compliance_check: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
]

const createChain = (resolveData: unknown, options?: { trackOrder?: ReturnType<typeof vi.fn> }) => {
  const chain: Record<string, unknown> = {
    select: vi.fn(function (this: typeof chain) {
      return this
    }),
    eq: vi.fn(function (this: typeof chain) {
      return this
    }),
    in: vi.fn(function (this: typeof chain) {
      return this
    }),
    order: vi.fn(function (this: typeof chain, column: string, opts: { ascending: boolean }) {
      options?.trackOrder?.(column, opts)
      return this
    }),
    single: vi.fn(() => Promise.resolve({ data: resolveData, error: null })),
  }
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.in = vi.fn(() => chain)
  chain.order = vi.fn((column: string, opts: { ascending: boolean }) => {
    options?.trackOrder?.(column, opts)
    return Promise.resolve({ data: resolveData, error: null })
  })
  return chain
}

const mockReviewQueueAssets = [
  {
    id: 'asset-old',
    campaign_id: 'camp-old',
    status: 'submitted',
    updated_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-05T00:00:00Z',
    campaigns: { id: 'camp-old', name: 'Older Campaign', brand_id: 'brand-1', brands: { id: 'brand-1', name: 'Brand' } },
  },
  {
    id: 'asset-new',
    campaign_id: 'camp-new',
    status: 'brand_review',
    updated_at: '2024-01-10T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    campaigns: { id: 'camp-new', name: 'Newer Campaign', brand_id: 'brand-1', brands: { id: 'brand-1', name: 'Brand' } },
  },
]

const reviewQueueOrderSpy = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return createChain(mockCampaign)
      }
      if (table === 'creative_assets') {
        let reviewQueueQuery = false
        const chain = createChain(mockAssets)
        chain.in = vi.fn(() => {
          reviewQueueQuery = true
          return chain
        })
        chain.order = vi.fn((column: string, opts: { ascending: boolean }) => {
          if (reviewQueueQuery) {
            reviewQueueOrderSpy(column, opts)
            return Promise.resolve({ data: mockReviewQueueAssets, error: null })
          }
          return Promise.resolve({ data: mockAssets, error: null })
        })
        delete chain.single
        return chain
      }
      if (table === 'brands') {
        return createChain({ id: 'brand-1', name: 'Test Brand' })
      }
      return createChain(null)
    }),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useCampaignQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCampaign', () => {
    it('fetches campaign when enabled', async () => {
      const { result } = renderHook(() => useCampaign('camp-1'), {
        wrapper: createWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockCampaign)
    })

    it('does not fetch when campaignId is empty', () => {
      const { result } = renderHook(() => useCampaign(''), {
        wrapper: createWrapper(),
      })
      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useCampaignAssets', () => {
    it('fetches assets when enabled', async () => {
      const { result } = renderHook(() => useCampaignAssets('camp-1'), {
        wrapper: createWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockAssets)
    })
  })

  describe('useBrand', () => {
    it('fetches brand when brandId provided', async () => {
      const { result } = renderHook(() => useBrand('brand-1'), {
        wrapper: createWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveProperty('name', 'Test Brand')
    })

    it('does not fetch when brandId is undefined', () => {
      const { result } = renderHook(() => useBrand(undefined), {
        wrapper: createWrapper(),
      })
      expect(result.current.isFetching).toBe(false)
    })
  })

  describe('useReviewQueue', () => {
    it('orders pending assets by updated_at ascending and groups oldest campaigns first', async () => {
      const { result } = renderHook(() => useReviewQueue(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(reviewQueueOrderSpy).toHaveBeenCalledWith('updated_at', { ascending: true })
      expect(result.current.data?.[0]?.campaignName).toBe('Older Campaign')
      expect(result.current.data?.[1]?.campaignName).toBe('Newer Campaign')
    })
  })
})
