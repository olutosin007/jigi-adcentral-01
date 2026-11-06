import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

interface GoogleSignInButtonProps {
  label?: string
}

export function GoogleSignInButton({ label = 'Continue with Google' }: GoogleSignInButtonProps) {
  const { signInWithGoogle, isLoading } = useAuthStore()

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isLoading}
      onClick={() => void signInWithGoogle()}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting…
        </>
      ) : (
        label
      )}
    </Button>
  )
}
