import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Palette, Type, MessageSquare, Users, Building2, Settings, Edit, Loader2, AlertCircle, Archive, ArchiveRestore, Trash2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DeleteBrandDialog } from '@/components/brands/DeleteBrandDialog'
import { BrandColorsEditor } from '@/components/brands/BrandColorsEditor'
import { BrandTypographyEditor } from '@/components/brands/BrandTypographyEditor'
import { BrandToneEditor } from '@/components/brands/BrandToneEditor'
import { BrandWordListsEditor } from '@/components/brands/BrandWordListsEditor'
import { BrandVisualStyleEditor } from '@/components/brands/BrandVisualStyleEditor'
import { BrandStrategyEditor } from '@/components/brands/BrandStrategyEditor'
import { BrandEssentialsChecklist } from '@/components/brands/BrandEssentialsChecklist'
import { BrandPreviewPanel } from '@/components/brands/BrandPreviewPanel'
import { useBrandStore, type BrandIdentity, type BrandVoice, type BrandStrategy } from '@/store/brandStore'
import { deriveBrandEssentials, deriveBrandProfileStatus } from '@/lib/brand-profile-status'
import { getContrastColor } from '@/lib/colors'
import { loadGoogleFont } from '@/lib/fonts'
import { cn } from '@/lib/utils'

const statusLabels = {
  complete: 'On-brand ready',
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
  const [editingColors, setEditingColors] = useState(false)
  const [editingTypography, setEditingTypography] = useState(false)
  const [editingTone, setEditingTone] = useState(false)
  const [editingWords, setEditingWords] = useState(false)
  const [editingVisualStyle, setEditingVisualStyle] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState(false)
  const [kitSaving, setKitSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('identity')

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

    const result = await updateBrand(id, { name: editedName.trim() }, { quiet: true })
    if (result.success) {
      toast.success('Brand name updated')
      setIsEditing(false)
    } else {
      toast.error(result.error || 'Failed to update brand name')
    }
  }

  const saveBrandKit = async (patch: {
    identity?: BrandIdentity
    voice?: BrandVoice
    strategy?: BrandStrategy
  }) => {
    if (!id || !currentBrand) return false
    setKitSaving(true)
    const identity = { ...currentBrand.identity, ...patch.identity }
    const voice = { ...currentBrand.voice, ...patch.voice }
    const strategy = { ...currentBrand.strategy, ...patch.strategy }
    const brand_profile_status = deriveBrandProfileStatus(identity, voice)
    const result = await updateBrand(
      id,
      { identity, voice, strategy, brand_profile_status },
      { quiet: true }
    )
    setKitSaving(false)
    if (result.success) {
      toast.success('Brand kit updated')
      return true
    }
    toast.error(result.error || 'Failed to update brand kit')
    return false
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

  const { identity, voice, strategy, brand_profile_status: status } = currentBrand
  const essentials = deriveBrandEssentials(identity, voice)
  const colours = identity?.colours || {}
  const fonts = identity?.fonts || {}
  const tone = voice?.tone || []
  const preferredWords = voice?.preferred_words || []
  const avoidedWords = voice?.avoided_words || []

  const isArchived = currentBrand.status === 'archived'
  const isKitEditing =
    isEditing ||
    editingColors ||
    editingTypography ||
    editingTone ||
    editingWords ||
    editingVisualStyle ||
    editingStrategy

  const handleEssentialAction = (essentialId: string) => {
    switch (essentialId) {
      case 'primary_colour':
        setActiveTab('identity')
        setEditingColors(true)
        break
      case 'typography':
        setActiveTab('identity')
        setEditingTypography(true)
        break
      case 'tone':
        setActiveTab('voice')
        setEditingTone(true)
        break
      case 'word_lists':
        setActiveTab('voice')
        setEditingWords(true)
        break
      case 'logo':
        navigate('/app/onboarding')
        break
      case 'visual_style':
        setActiveTab('identity')
        setEditingVisualStyle(true)
        break
      default:
        break
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
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
                  {statusLabels[status]} · {essentials.score}/{essentials.maxScore}
                </Badge>
                {status !== 'complete' && (
                  <span className="text-xs text-muted-foreground">
                    Complete essentials below for on-brand AI
                  </span>
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

      {!isArchived && essentials.score < essentials.maxScore && (
        <BrandEssentialsChecklist
          items={essentials.items}
          score={essentials.score}
          maxScore={essentials.maxScore}
          onItemAction={handleEssentialAction}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="space-y-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Brand Colors
                </CardTitle>
                <CardDescription>Your brand&apos;s color palette — primary, secondary, accent</CardDescription>
              </div>
              {!editingColors && !isArchived && (
                <Button variant="outline" size="sm" onClick={() => setEditingColors(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingColors ? (
                <BrandColorsEditor
                  colours={colours}
                  isSaving={kitSaving}
                  onCancel={() => setEditingColors(false)}
                  onSave={async (nextColours) => {
                    const ok = await saveBrandKit({ identity: { ...identity, colours: nextColours } })
                    if (ok) setEditingColors(false)
                  }}
                />
              ) : Object.keys(colours).length > 0 ? (
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
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No colors defined yet.</p>
                  {!isArchived && (
                    <Button variant="outline" size="sm" onClick={() => setEditingColors(true)}>
                      Add colors
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-primary" />
                  Typography
                </CardTitle>
                <CardDescription>Your brand&apos;s fonts</CardDescription>
              </div>
              {!editingTypography && !isArchived && (
                <Button variant="outline" size="sm" onClick={() => setEditingTypography(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingTypography ? (
                <BrandTypographyEditor
                  fonts={fonts}
                  isSaving={kitSaving}
                  onCancel={() => setEditingTypography(false)}
                  onSave={async (nextFonts) => {
                    const ok = await saveBrandKit({ identity: { ...identity, fonts: nextFonts } })
                    if (ok) setEditingTypography(false)
                  }}
                />
              ) : fonts.heading || fonts.body ? (
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
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No fonts defined yet.</p>
                  {!isArchived && (
                    <Button variant="outline" size="sm" onClick={() => setEditingTypography(true)}>
                      Add typography
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Visual Style
                </CardTitle>
                <CardDescription>
                  Photography and art direction for on-brand image generation
                </CardDescription>
              </div>
              {!editingVisualStyle && !isArchived && (
                <Button variant="outline" size="sm" onClick={() => setEditingVisualStyle(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingVisualStyle ? (
                <BrandVisualStyleEditor
                  visualStyle={identity?.visual_style || ''}
                  isSaving={kitSaving}
                  onCancel={() => setEditingVisualStyle(false)}
                  onSave={async (visual_style) => {
                    const ok = await saveBrandKit({ identity: { ...identity, visual_style } })
                    if (ok) setEditingVisualStyle(false)
                  }}
                />
              ) : identity?.visual_style ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{identity.visual_style}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No visual direction yet — image generation may feel generic.
                  </p>
                  {!isArchived && (
                    <Button variant="outline" size="sm" onClick={() => setEditingVisualStyle(true)}>
                      Add visual style
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Brand Strategy
                </CardTitle>
                <CardDescription>Positioning and differentiators for concept generation</CardDescription>
              </div>
              {!editingStrategy && !isArchived && (
                <Button variant="outline" size="sm" onClick={() => setEditingStrategy(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingStrategy ? (
                <BrandStrategyEditor
                  positioning={strategy?.positioning || ''}
                  differentiators={strategy?.differentiators || []}
                  isSaving={kitSaving}
                  onCancel={() => setEditingStrategy(false)}
                  onSave={async (positioning, differentiators) => {
                    const ok = await saveBrandKit({ strategy: { ...strategy, positioning, differentiators } })
                    if (ok) setEditingStrategy(false)
                  }}
                />
              ) : strategy?.positioning || (strategy?.differentiators?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {strategy?.positioning && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Positioning
                      </p>
                      <p className="text-sm text-foreground">{strategy.positioning}</p>
                    </div>
                  )}
                  {strategy?.differentiators && strategy.differentiators.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Differentiators
                      </p>
                      <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                        {strategy.differentiators.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Add positioning and differentiators to strengthen concept alignment.
                  </p>
                  {!isArchived && (
                    <Button variant="outline" size="sm" onClick={() => setEditingStrategy(true)}>
                      Add strategy
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Brand Tone
                </CardTitle>
                <CardDescription>Words that describe your brand&apos;s voice</CardDescription>
              </div>
              {!editingTone && !isArchived && (
                <Button variant="outline" size="sm" onClick={() => setEditingTone(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingTone ? (
                <BrandToneEditor
                  tone={tone}
                  isSaving={kitSaving}
                  onCancel={() => setEditingTone(false)}
                  onSave={async (nextTone) => {
                    const ok = await saveBrandKit({ voice: { ...voice, tone: nextTone } })
                    if (ok) setEditingTone(false)
                  }}
                />
              ) : tone.length > 0 ? (
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
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No tone defined yet.</p>
                  {!isArchived && (
                    <Button variant="outline" size="sm" onClick={() => setEditingTone(true)}>
                      Add tone
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md md:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Language rules</CardTitle>
                <CardDescription>Preferred and avoided words for copy generation</CardDescription>
              </div>
              {!editingWords && !isArchived && (
                <Button variant="outline" size="sm" onClick={() => setEditingWords(true)}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingWords ? (
                <BrandWordListsEditor
                  preferredWords={preferredWords}
                  avoidedWords={avoidedWords}
                  isSaving={kitSaving}
                  onCancel={() => setEditingWords(false)}
                  onSave={async (preferred, avoided) => {
                    const ok = await saveBrandKit({
                      voice: {
                        ...voice,
                        preferred_words: preferred,
                        avoided_words: avoided,
                      },
                    })
                    if (ok) setEditingWords(false)
                  }}
                />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-success mb-2">Preferred words</p>
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
                  </div>
                  <div>
                    <p className="text-sm font-medium text-destructive mb-2">Avoided words</p>
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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

        {!isKitEditing && !isArchived && (
          <BrandPreviewPanel
            brandName={currentBrand.name}
            identity={identity}
            voice={voice}
            essentials={essentials}
          />
        )}
      </div>
    </div>
  )
}
