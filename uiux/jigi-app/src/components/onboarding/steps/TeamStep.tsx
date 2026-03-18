import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Plus, X, Users, Building2, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TEAM_ROLES } from '@/lib/validations/brand'

import type { OnboardingFormData } from '../OnboardingWizard'

interface TeamInvite {
  email: string
  role: 'admin' | 'approver' | 'reviewer'
}

export function TeamStep() {
  const { control, watch, setValue } = useFormContext<OnboardingFormData>()
  const [emailInput, setEmailInput] = useState('')
  const [roleInput, setRoleInput] = useState<TeamInvite['role']>('reviewer')
  
  const teamInvites = watch('teamInvites') || []

  const addTeamMember = () => {
    if (!emailInput.trim()) return
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailInput)) return

    if (teamInvites.some((invite) => invite.email === emailInput.trim())) return

    setValue('teamInvites', [
      ...teamInvites,
      { email: emailInput.trim(), role: roleInput },
    ])
    setEmailInput('')
  }

  const removeTeamMember = (email: string) => {
    setValue('teamInvites', teamInvites.filter((invite) => invite.email !== email))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTeamMember()
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Invite team members to collaborate on your brand and connect with your agency.
        You can skip this step and invite people later.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Invite Team Members
          </CardTitle>
          <CardDescription>
            Add colleagues who will work on creative generation and approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="colleague@company.com"
              type="email"
              className="flex-1"
            />
            <Select
              value={roleInput}
              onValueChange={(value) => setRoleInput(value as TeamInvite['role'])}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={addTeamMember}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {teamInvites.length > 0 && (
            <div className="space-y-2">
              {teamInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {invite.role}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTeamMember(invite.email)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-dashed p-4 bg-muted/10">
            <div className="text-xs text-muted-foreground space-y-1">
              {TEAM_ROLES.map((role) => (
                <p key={role.value}>
                  <span className="font-medium">{role.label}:</span> {role.description}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Connect Agency
          </CardTitle>
          <CardDescription>
            Invite an agency to generate creative on behalf of your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="agencyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agency Contact Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="contact@agency.com"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  The agency will receive an invitation to connect with your brand.
                  They'll need to accept before they can generate creative.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2">What happens next?</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Team members will receive an email invitation</li>
            <li>They'll create an account (or sign in) to join your brand</li>
            <li>Agency connections require approval from the agency</li>
            <li>You can manage permissions anytime in brand settings</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
