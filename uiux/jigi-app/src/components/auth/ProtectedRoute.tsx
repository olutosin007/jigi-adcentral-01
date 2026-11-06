import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requireOrganisation?: boolean
  requireJourneyMode?: boolean
}

export function ProtectedRoute({
  children,
  requireOrganisation = false,
  requireJourneyMode = false,
}: ProtectedRouteProps) {
  const { user, profile, isLoading, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireOrganisation && !profile?.organisation_id) {
    return <Navigate to="/setup/organisation" state={{ from: location }} replace />
  }

  if (requireOrganisation && profile?.organisation_id && !profile?.journey_mode) {
    return <Navigate to="/setup/journey" state={{ from: location }} replace />
  }

  if (requireJourneyMode && !profile?.journey_mode) {
    return <Navigate to="/setup/journey" state={{ from: location }} replace />
  }

  return <>{children}</>
}
