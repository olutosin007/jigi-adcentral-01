import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Building2, Palette } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store'
import { supabase } from '@/lib/supabase'
import { organisationSetupSchema, type OrganisationSetupFormData } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Media & Entertainment',
  'Education',
  'Real Estate',
  'Travel & Hospitality',
  'Food & Beverage',
  'Other',
]

type OrgType = 'brand' | 'agency'

export function OrganisationSetup() {
  const navigate = useNavigate()
  const { user, fetchProfile } = useAuthStore()
  const { setOrganisation } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<OrgType | null>(null)

  const form = useForm<OrganisationSetupFormData>({
    resolver: zodResolver(organisationSetupSchema),
    defaultValues: {
      name: '',
      type: undefined,
      industry: '',
    },
  })

  const handleTypeSelect = (type: OrgType) => {
    setSelectedType(type)
    form.setValue('type', type)
  }

  const onSubmit = async (data: OrganisationSetupFormData) => {
    if (!user) {
      toast.error('You must be logged in')
      return
    }

    setIsSubmitting(true)

    try {
      // Ensure public.users row exists (signup trigger may have missed it)
      const { error: upsertUserError } = await supabase.from('users').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          name: user.user_metadata?.name ?? '',
          full_name: user.user_metadata?.name ?? '',
          role: 'admin',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      if (upsertUserError) {
        console.error('Failed to ensure user row:', upsertUserError)
        toast.error(upsertUserError.message || 'Please contact support. Your account may need to be synced.')
        return
      }

      const organisationId = crypto.randomUUID()

      const { error: orgError } = await supabase
        .from('organisations')
        .insert({
          id: organisationId,
          name: data.name,
          type: data.type,
          industry: data.industry || null,
        })

      if (orgError) {
        throw new Error(orgError.message)
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ organisation_id: organisationId })
        .eq('id', user.id)

      if (userError) {
        throw new Error(userError.message)
      }

      setOrganisation({
        id: organisationId,
        name: data.name,
        type: data.type,
      })

      await fetchProfile()

      toast.success('Organisation created!')
      navigate('/setup/journey')
    } catch (error) {
      console.error('Organisation setup error:', error)
      const message = error instanceof Error ? error.message : 'Failed to create organisation'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const userName = user?.user_metadata?.name || 'there'

  return (
    <AuthLayout
      title={`Welcome to Jigi, ${userName}!`}
      subtitle="Let's set up your organisation"
    >
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
        <span className="font-medium text-foreground">Step 1 of 2</span>
        <span>— Organisation setup</span>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="type"
            render={() => (
              <FormItem>
                <FormLabel>What type of organisation are you?</FormLabel>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => handleTypeSelect('brand')}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all',
                      selectedType === 'brand'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full',
                      selectedType === 'brand' ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <Palette className={cn(
                        'h-6 w-6',
                        selectedType === 'brand' ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">Brand</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        I maintain brand guidelines and approve work
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSelect('agency')}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all',
                      selectedType === 'agency'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full',
                      selectedType === 'agency' ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <Building2 className={cn(
                        'h-6 w-6',
                        selectedType === 'agency' ? 'text-primary' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">Agency</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        I create creative for brands
                      </p>
                    </div>
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organisation name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry (optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry.toLowerCase()}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full transition-colors"
            disabled={isSubmitting || !selectedType}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Continue to setup'
            )}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
