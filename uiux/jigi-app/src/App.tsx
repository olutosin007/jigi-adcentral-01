import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { LandingPage } from '@/pages/Landing'
import { LandingV2 } from '@/pages/LandingV2'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Dashboard } from '@/pages/Dashboard'
import { CampaignDetail } from '@/pages/CampaignDetail'
import { AssetReview } from '@/pages/AssetReview'
import { QuickStart } from '@/pages/QuickStart'
import { Onboarding } from '@/pages/Onboarding'
import { Brands } from '@/pages/Brands'
import { BrandProfile } from '@/pages/BrandProfile'
import { Campaigns } from '@/pages/Campaigns'
import { CampaignCreate } from '@/pages/CampaignCreate'
import { ApprovedAssets } from '@/pages/ApprovedAssets'
import { ReviewQueue } from '@/pages/ReviewQueue'
import { Settings } from '@/pages/Settings'

import { Login } from '@/pages/auth/Login'
import { Signup } from '@/pages/auth/Signup'
import { ResetPassword } from '@/pages/auth/ResetPassword'
import { ResetPasswordConfirm } from '@/pages/auth/ResetPasswordConfirm'
import { OrganisationSetup } from '@/pages/setup/OrganisationSetup'
import { JourneyChoice } from '@/pages/setup/JourneyChoice'
import { ReviewerRoute } from '@/components/auth/ReviewerRoute'

import { useAuthStore } from '@/store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return <>{children}</>
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <Routes>
          {/* Public landing page — v2 is main; v1 retired at /landing-v1 for rollback */}
          <Route path="/" element={<LandingV2 />} />
          <Route path="/landing-v1" element={<LandingPage />} />
          <Route path="/landing-v2" element={<LandingV2 />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
          
          {/* Setup routes (require auth but not full setup) */}
          <Route
            path="/setup/organisation"
            element={
              <ProtectedRoute>
                <OrganisationSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setup/journey"
            element={
              <ProtectedRoute requireOrganisation>
                <JourneyChoice />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/app"
            element={
              <ProtectedRoute requireOrganisation>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Journey entry points */}
            <Route path="quick-start" element={<QuickStart />} />
            <Route path="onboarding" element={<Onboarding />} />
            
            {/* Brand management */}
            <Route path="brands" element={<Brands />} />
            <Route path="brands/:id" element={<BrandProfile />} />
            
            {/* Campaign management */}
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/new" element={<CampaignCreate />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            
            {/* Asset management & Review */}
            <Route path="approved" element={<ApprovedAssets />} />
            <Route
              path="review"
              element={
                <ReviewerRoute>
                  <ReviewQueue />
                </ReviewerRoute>
              }
            />
            <Route
              path="review/:assetId"
              element={
                <ReviewerRoute>
                  <AssetReview />
                </ReviewerRoute>
              }
            />
            
            {/* Settings */}
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster position="top-right" richColors />
      </AuthInitializer>
    </QueryClientProvider>
  )
}
