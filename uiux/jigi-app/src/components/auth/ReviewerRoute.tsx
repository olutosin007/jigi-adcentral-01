import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { isReviewerRole } from '@/lib/roles'
import { useEffectiveRole } from '@/hooks/useEffectiveRole'

interface ReviewerRouteProps {
  children: ReactNode
}

export function ReviewerRoute({ children }: ReviewerRouteProps) {
  const { isLoading, isInitialized } = useAuthStore()
  // Presentation gate: respects the demo "view as" override so the approver
  // walkthrough is reachable in one session. Data stays RLS-protected.
  const effectiveRole = useEffectiveRole()

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isReviewerRole(effectiveRole)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
