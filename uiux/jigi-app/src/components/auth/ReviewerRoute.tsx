import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { isReviewerRole } from '@/lib/roles'

interface ReviewerRouteProps {
  children: ReactNode
}

export function ReviewerRoute({ children }: ReviewerRouteProps) {
  const { profile, isLoading, isInitialized } = useAuthStore()

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isReviewerRole(profile?.role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return <>{children}</>
}
