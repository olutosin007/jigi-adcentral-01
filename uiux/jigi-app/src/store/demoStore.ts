import { create } from 'zustand'
import type { UserRole } from '@/lib/roles'

/**
 * Client-only "demo" state that powers the guided-tour handoff.
 *
 * `viewAsRole` lets a single session preview a different persona's UI (Agency
 * Creative vs Brand Approver) without touching the real profile in Supabase.
 * It is a *presentation* override only — server-side RLS remains the real
 * security boundary, so switching roles never exposes data the signed-in user
 * can't already access.
 *
 * `demoCampaignId` / `demoAssetId` are resolved at tour start so the
 * campaign- and asset-scoped tour steps can navigate to concrete routes.
 */
interface DemoState {
  viewAsRole: UserRole | null
  demoCampaignId: string | null
  demoAssetId: string | null
  setViewAsRole: (role: UserRole | null) => void
  setDemoCampaignId: (id: string | null) => void
  setDemoAssetId: (id: string | null) => void
  resetDemo: () => void
}

export const useDemoStore = create<DemoState>((set) => ({
  viewAsRole: null,
  demoCampaignId: null,
  demoAssetId: null,
  setViewAsRole: (viewAsRole) => set({ viewAsRole }),
  setDemoCampaignId: (demoCampaignId) => set({ demoCampaignId }),
  setDemoAssetId: (demoAssetId) => set({ demoAssetId }),
  resetDemo: () => set({ viewAsRole: null, demoCampaignId: null, demoAssetId: null }),
}))
