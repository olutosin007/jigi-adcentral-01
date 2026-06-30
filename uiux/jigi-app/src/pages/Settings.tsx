'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Bell, Shield, Palette, Key, Users, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { USER_ROLES } from '@/lib/validations/brand'
import { uploadAvatar, isAllowedAvatarType } from '@/lib/avatar-upload'

function getProfileInitial(name: string | null, email: string): string {
  const first = (name?.trim() || email?.[0] || 'U').toUpperCase().slice(0, 1)
  return first || 'U'
}

export function Settings() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const { profile, updateProfile, user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [roleInput, setRoleInput] = useState<string>('admin')

  useEffect(() => {
    if (profile) {
      setNameInput(profile.name ?? '')
      setRoleInput(profile.role ?? 'admin')
    }
  }, [profile])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    if (!isAllowedAvatarType(file.type)) {
      toast.error('Avatar must be JPEG, PNG, or WebP')
      return
    }
    setIsUploadingAvatar(true)
    e.target.value = ''
    try {
      const url = await uploadAvatar(user.id, file)
      const result = await updateProfile({ avatar_url: url })
      if (result.success) {
        toast.success('Profile picture updated')
      } else {
        toast.error(result.error ?? 'Failed to update profile picture')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const payload: { name: string | null; role?: 'admin' | 'approver' | 'reviewer' | 'creator' } = {
        name: nameInput || null,
      }
      if (profile?.role === 'admin') {
        payload.role = roleInput as 'admin' | 'approver' | 'reviewer' | 'creator'
      }
      const result = await updateProfile(payload)
      if (result.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(result.error ?? 'Failed to update profile')
      }
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!profile ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-48" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-6">
                    <div className="relative shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        aria-label="Upload profile picture"
                        onChange={handleAvatarChange}
                      />
                      <Avatar className="h-20 w-20 rounded-full border-2 border-border bg-gradient-to-br from-primary to-primary/80">
                        <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.name ?? 'Profile'} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-xl font-semibold text-white">
                          {getProfileInitial(profile.name, profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-0 right-0 h-7 w-7 rounded-full p-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        aria-label="Change profile picture"
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="flex-1 space-y-4 min-w-0">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Your name"
                          className="h-10 w-full max-w-[30rem]"
                          aria-label="Display name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          readOnly
                          className="h-10 w-full max-w-[30rem] bg-muted"
                          aria-label="Email address"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email cannot be changed here. Use account settings to update.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        {profile.role === 'admin' ? (
                          <>
                            <Select
                              value={roleInput}
                              onValueChange={setRoleInput}
                              aria-label="User role"
                            >
                              <SelectTrigger id="role" className="h-10 w-full sm:w-[280px]">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {USER_ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {USER_ROLES.find((r) => r.value === roleInput)?.description}
                            </p>
                          </>
                        ) : (
                          <>
                            <Input
                              id="role"
                              value={USER_ROLES.find((r) => r.value === profile.role)?.label ?? profile.role}
                              readOnly
                              className="h-10 w-full sm:w-[280px] bg-muted"
                              aria-label="User role"
                            />
                            <p className="text-xs text-muted-foreground">
                              Role is assigned by your organisation admin.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                <div>
                  <Label id="dark-mode-label" className="font-medium">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Switch to dark theme for reduced eye strain
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  aria-labelledby="dark-mode-label"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                <div>
                  <p className="font-medium">Asset Approval Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when assets need review
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                <div>
                  <p className="font-medium">Generation Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Alert when asset generation finishes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>Manage team access and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 text-center">
                <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Coming soon
                </p>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  Invite team members and manage roles.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>Manage API access for integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 text-center">
                <Key className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  Coming soon
                </p>
                <p className="mt-1 text-sm text-muted-foreground/80">
                  Generate and manage API keys for programmatic access.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Two-factor authentication and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" className="transition-colors hover:bg-muted">
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
