import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { isEmailAllowed, authAllowlistDeniedMessage } from '@/lib/auth-allowlist'
import { useAuthStore } from '@/store/authStore'

export function AuthCallback() {
  const navigate = useNavigate()
  const { fetchProfile, isInitialized } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isInitialized) return

    let cancelled = false

    const finish = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        const email = session?.user?.email
        if (!session?.user || !email) {
          if (!cancelled) navigate('/login', { replace: true })
          return
        }

        if (!isEmailAllowed(email)) {
          await supabase.auth.signOut()
          const message = authAllowlistDeniedMessage()
          if (!cancelled) {
            toast.error(message)
            setError(message)
            navigate('/login', { replace: true })
          }
          return
        }

        await fetchProfile()
        const profile = useAuthStore.getState().profile

        if (!cancelled) {
          if (!profile?.organisation_id) {
            navigate('/setup/organisation', { replace: true })
          } else if (!profile.journey_mode) {
            navigate('/setup/journey', { replace: true })
          } else {
            navigate('/app/dashboard', { replace: true })
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign-in failed'
        if (!cancelled) {
          setError(message)
          toast.error(message)
          navigate('/login', { replace: true })
        }
      }
    }

    void finish()
    return () => {
      cancelled = true
    }
  }, [isInitialized, navigate, fetchProfile])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="mt-3 text-sm text-muted-foreground">
        {error ?? 'Completing sign-in…'}
      </p>
    </div>
  )
}
