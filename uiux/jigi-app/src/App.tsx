import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { LandingPage } from '@/pages/Landing'
import { LandingV2 } from '@/pages/LandingV2'
import { Pricing } from '@/pages/Pricing'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Dashboard } from '@/pages/Dashboard'
import { Work } from '@/pages/Work'
import { CampaignDetail } from '@/pages/CampaignDetail'
import { AssetReview } from '@/pages/AssetReview'
import { GenerateNow } from '@/pages/GenerateNow'
import { Onboarding } from '@/pages/Onboarding'
import { Brands } from '@/pages/Brands'
import { BrandProfile } from '@/pages/BrandProfile'
import { Campaigns } from '@/pages/Campaigns'
import { CampaignCreate } from '@/pages/CampaignCreate'
import { ApprovedAssets } from '@/pages/ApprovedAssets'
import { ReviewQueue } from '@/pages/ReviewQueue'
import { Settings } from '@/pages/Settings'
import { DesignSystem } from '@/pages/DesignSystem'

import { Login } from '@/pages/auth/Login'
import { Signup } from '@/pages/auth/Signup'
import { ResetPassword } from '@/pages/auth/ResetPassword'
import { ResetPasswordConfirm } from '@/pages/auth/ResetPasswordConfirm'
import { AuthCallback } from '@/pages/auth/AuthCallback'
import { OrganisationSetup } from '@/pages/setup/OrganisationSetup'
import { JourneyChoice } from '@/pages/setup/JourneyChoice'
import { ReviewerRoute } from '@/components/auth/ReviewerRoute'
import { GuestDecide } from '@/pages/GuestDecide'

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
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/r/:token" element={<GuestDecide />} />
          {import.meta.env.DEV && (
            <Route
              path="/dev/design-system"
              element={
                <div className="min-h-screen bg-background p-6 sm:p-10">
                  <DesignSystem />
                </div>
              }
            />
          )}
          
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
            <Route index element={<Navigate to="work" replace />} />
            <Route path="work" element={<Work />} />
            <Route path="dashboard" element={<Navigate to="/app/work" replace />} />
            <Route path="overview" element={<Dashboard />} />
            
            {/* Journey entry points */}
            <Route path="generate" element={<GenerateNow />} />
            <Route path="quick-start" element={<Navigate to="/app/generate" replace />} />
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
            <Route path="design-system" element={<DesignSystem />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster position="top-right" richColors />
      </AuthInitializer>
    </QueryClientProvider>
  )
}
