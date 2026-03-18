import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthStore } from '@/store/authStore'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth'

export function ResetPassword() {
  const { resetPassword } = useAuthStore()
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true)
    const result = await resetPassword(data.email)
    setIsSubmitting(false)
    
    if (result.success) {
      setSentEmail(data.email)
      setEmailSent(true)
      toast.success('Password reset email sent')
    } else {
      toast.error(result.error || 'Failed to send reset email')
    }
  }

  if (emailSent) {
    return (
      <AuthLayout title="Check your email" subtitle="">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          
          <p className="text-muted-foreground">
            We've sent a password reset link to{' '}
            <span className="font-medium text-foreground">{sentEmail}</span>
          </p>
          
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              type="button"
              className="font-medium text-primary hover:text-primary/90 hover:underline transition-colors"
              onClick={() => setEmailSent(false)}
            >
              try again
            </button>
          </p>
        </div>

        <div className="mt-8">
          <Link to="/login">
            <Button variant="outline" className="w-full hover:bg-muted transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-6">
        <Link to="/login">
          <Button variant="ghost" className="w-full hover:bg-muted transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </div>
    </AuthLayout>
  )
}
