import { useAuthStore } from '@/store/authStore'
import { useDemoStore } from '@/store/demoStore'
import type { UserRole } from '@/lib/roles'

/**
 * The role the UI should present as: the demo "view as" override when set,
 * otherwise the signed-in user's real role. Use this for *presentation*
 * decisions (nav visibility, CTAs, route gating) — not for authorising data
 * access, which stays enforced by Supabase RLS.
 */
export function useEffectiveRole(): UserRole | null {
  const profileRole = useAuthStore((s) => s.profile?.role)
  const viewAsRole = useDemoStore((s) => s.viewAsRole)
  return viewAsRole ?? profileRole ?? null
}
