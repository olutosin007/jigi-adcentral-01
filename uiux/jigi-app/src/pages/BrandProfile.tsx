import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Palette, Type, MessageSquare, Users, Building2, Settings, Edit, Loader2, AlertCircle, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DeleteBrandDialog } from '@/components/brands/DeleteBrandDialog'
import { useBrandStore } from '@/store/brandStore'
import { getContrastColor } from '@/lib/colors'
import { loadGoogleFont } from '@/lib/fonts'
import { cn } from '@/lib/utils'

const statusLabels = {
  complete: 'Complete',
  partial: 'Partial',
  starter: 'Starter',
}

const statusColors = {
  complete: 'bg-success/10 text-success',
  partial: 'bg-amber-100 text-amber-800',
  starter: 'bg-muted text-muted-foreground',
}

export function BrandProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentBrand, fetchBrand, updateBrand, deleteBrand, archiveBrand, unarchiveBrand, fetchBrands, agencyAccess, fetchAgencyAccess } = useBrandStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadBrand()
    }
  }, [id])

  const loadBrand = async () => {
    if (!id) return
    setIsLoading(true)
    await fetchBrand(id)
    await fetchAgencyAccess(id)
    setIsLoading(false)
  }

  useEffect(() => {
    if (currentBrand) {
      setEditedName(currentBrand.name)
    }
  }, [currentBrand])

  const headingFont = currentBrand?.identity?.fonts?.heading
  const bodyFont = currentBrand?.identity?.fonts?.body

  useEffect(() => {
    loadGoogleFont(headingFont)
    loadGoogleFont(bodyFont)
  }, [headingFont, bodyFont])

  const handleSaveName = async () => {
    if (!id || !editedName.trim()) return

    const result = await updateBrand(id, { name: editedName.trim() })
    if (result.success) {
      toast.success('Brand name updated')
      setIsEditing(false)
    } else {
      toast.error(result.error || 'Failed to update brand name')
    }
  }

  const handleArchive = async () => {
    if (!id) return
    const result = await archiveBrand(id)
    if (result.success) {
      toast.success('Brand archived')
      loadBrand()
      fetchBrands()
    } else {
      toast.error(result.error ?? 'Failed to archive brand')
    }
  }

  const handleUnarchive = async () => {
    if (!id) return
    const result = await unarchiveBrand(id)
    if (result.success) {
      toast.success('Brand restored')
      loadBrand()
      fetchBrands()
    } else {
      toast.error(result.error ?? 'Failed to restore brand')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!id) return
    setIsDeleting(true)
    const result = await deleteBrand(id)
    setIsDeleting(false)
    if (result.success) {
      toast.success('Brand deleted')
      setShowDeleteDialog(false)
      navigate('/app/brands')
    } else {
      toast.error(result.error ?? 'Failed to delete brand')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading brand...</p>
        </div>
      </div>
    )
  }

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Brand not found</p>
          <Button variant="outline" onClick={() => navigate('/app/brands')}>
            Back to brands
          </Button>
        </div>
      </div>
    )
  }

  const { identity, voice, brand_profile_status: status } = currentBrand
  const colours = identity?.colours || {}
  const fonts = identity?.fonts || {}
  const tone = voice?.tone || []
  const preferredWords = voice?.preferred_words || []
  const avoidedWords = voice?.avoided_words || []

  const isArchived = currentBrand.status === 'archived'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/brands')} className="hover:bg-muted" aria-label="Back to brands">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            {identity?.logo_url ? (
              <img
                src={identity.logo_url}
                alt={currentBrand.name}
                className="h-12 w-12 rounded-lg object-contain bg-muted p-1"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: (colours.primary || '#0D9488') + '20' }}
              >
                <Building2 className="h-6 w-6" style={{ color: colours.primary || '#0D9488' }} />
              </div>
            )}
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8 text-lg font-semibold"
                  />
                  <Button size="sm" onClick={handleSaveName} className="transition-colors hover:bg-primary/90">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="hover:bg-muted">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{currentBrand.name}</h1>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted" onClick={() => setIsEditing(true)} aria-label="Edit brand name">
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1">
                {isArchived && (
                  <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                    Archived
                  </Badge>
                )}
                <Badge className={cn('text-xs', statusColors[status])}>
                  {statusLabels[status]}
                </Badge>
                {status !== 'complete' && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => navigate('/app/onboarding')}
                  >
                    Complete profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isArchived ? (
            <Button variant="outline" size="sm" onClick={handleUnarchive}>
              <ArchiveRestore className="w-3.5 h-3.5 mr-1" />
              Restore
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="w-3.5 h-3.5 mr-1" />
              Archive
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
            aria-label="Delete brand"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <DeleteBrandDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        brandName={currentBrand.name}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="space-y-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Brand Colors
              </CardTitle>
              <CardDescription>Your brand's color palette — primary, secondary, accent</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(colours).length > 0 ? (
                <div className="flex gap-6 flex-wrap">
                  {Object.entries(colours).map(([name, color]) => (
                    <div key={name} className="flex flex-col items-center gap-3 group">
                      <div
                        className="h-24 w-24 rounded-xl border-2 border-border shadow-md flex items-center justify-center text-sm font-mono transition-transform group-hover:scale-105 group-hover:shadow-lg"
                        style={{
                          backgroundColor: color as string,
                          color: getContrastColor(color as string),
                        }}
                      >
                        Aa
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium capitalize">{name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{color}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No colors defined. Complete your brand profile to add colors.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Typography
              </CardTitle>
              <CardDescription>Your brand's fonts</CardDescription>
            </CardHeader>
            <CardContent>
              {fonts.heading || fonts.body ? (
                <div className="space-y-4">
                  {fonts.heading && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Heading Font</p>
                      <p className="text-2xl font-bold" style={{ fontFamily: fonts.heading }}>
                        {fonts.heading}
                      </p>
                    </div>
                  )}
                  {fonts.body && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Body Font</p>
                      <p className="text-base" style={{ fontFamily: fonts.body }}>
                        {fonts.body} - The quick brown fox jumps over the lazy dog
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No fonts defined. Complete your brand profile to add typography.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Brand Tone
              </CardTitle>
              <CardDescription>Words that describe your brand's voice</CardDescription>
            </CardHeader>
            <CardContent>
              {tone.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tone.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-sm px-3 py-1.5 transition-colors hover:bg-primary/20 hover:text-primary cursor-default"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tone defined. Complete your brand profile to add tone descriptors.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base text-success">Preferred Words</CardTitle>
                <CardDescription>Words your brand likes to use</CardDescription>
              </CardHeader>
              <CardContent>
                {preferredWords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferredWords.map((word) => (
                      <Badge key={word} className="bg-green-100 text-green-700">
                        {word}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None defined</p>
                )}
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Avoided Words</CardTitle>
                <CardDescription>Words your brand avoids</CardDescription>
              </CardHeader>
              <CardContent>
                {avoidedWords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {avoidedWords.map((word) => (
                      <Badge key={word} className="bg-destructive/10 text-destructive">
                        {word}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None defined</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
              <CardDescription>People with access to this brand</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Team management coming soon. You'll be able to invite team members and manage their roles.
              </p>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Connected Agencies
              </CardTitle>
              <CardDescription>Agencies with access to generate creative</CardDescription>
            </CardHeader>
            <CardContent>
              {agencyAccess.length > 0 ? (
                <div className="space-y-3">
                  {agencyAccess.map((access) => (
                  <div
                    key={access.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                      <div>
                        <p className="text-sm font-medium">{access.invited_email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{access.status}</p>
                      </div>
                      <Badge variant={access.status === 'active' ? 'default' : 'secondary'}>
                        {access.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No agencies connected. Invite an agency during onboarding or in settings.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Brand Settings
              </CardTitle>
              <CardDescription>Configure brand-specific settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coming soon: Configure approval workflows, AI preferences, and more.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
