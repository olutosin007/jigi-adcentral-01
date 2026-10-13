import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Image as ImageIcon, Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TierPicker } from '@/components/generation/TierPicker'
import { useCampaignStore } from '@/store/campaignStore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import type { ImageAspectRatio } from '@/lib/ai'
import type { ImageTierId } from '@/lib/image-tiers'
import {
  DIRECT_PROMPT_MAX,
  buildDirectCampaignPayload,
  directGenerateStage,
  validateDirectPrompt,
  type DirectGenerateKind,
  type DirectGenerateRequest,
} from '@/lib/direct-generate'
import { PageTitle } from '@/design-system'

const KIND_OPTIONS: { id: DirectGenerateKind; label: string; hint: string; icon: typeof ImageIcon }[] = [
  { id: 'image', label: 'Image', hint: 'Straight to visuals', icon: ImageIcon },
  { id: 'concepts', label: 'Concepts', hint: 'Creative routes first', icon: Lightbulb },
]

export function GenerateNow() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialIdea = (location.state as { idea?: string } | null)?.idea ?? ''
  const { user } = useAuthStore()
  const { createCampaign } = useCampaignStore()

  const [prompt, setPrompt] = useState(initialIdea)
  const [kind, setKind] = useState<DirectGenerateKind>('image')
  const [imageTier, setImageTier] = useState<ImageTierId>('draft')
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1')
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const handleGenerate = async () => {
    const problem = validateDirectPrompt(prompt)
    if (problem) {
      setError(problem)
      return
    }
    if (!user?.id) {
      toast.error('You must be signed in to generate')
      return
    }
    setIsStarting(true)
    const result = await createCampaign(buildDirectCampaignPayload(prompt, user.id))
    if (!result.success || !result.campaign) {
      setIsStarting(false)
      toast.error(result.error || 'Could not start generation')
      return
    }
    const directGenerate: DirectGenerateRequest = { kind, prompt: prompt.trim(), imageTier, aspectRatio }
    navigate(`/app/campaigns/${result.campaign.id}?stage=${directGenerateStage(kind)}`, {
      state: { directGenerate },
    })
  }

  return (
    <div className="mx-auto max-w-2xl py-6 space-y-6">
      <header>
        <PageTitle>
          Generate now
        </PageTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Skip the brief. Describe what you want — add a brand, brief and reviewers later.
        </p>
      </header>

      <div className="bg-card rounded-[10px] border border-border p-4 shadow-sm space-y-4">
        <div className="space-y-2">
          <label htmlFor="direct-prompt" className="text-sm font-medium text-foreground">
            What do you want to make?
          </label>
          <Textarea
            id="direct-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void handleGenerate()
              }
            }}
            maxLength={DIRECT_PROMPT_MAX}
            rows={4}
            className="resize-none"
            placeholder="e.g. Sunlit bottle of cold brew on linen, morning light, minimal props…"
            aria-invalid={!!error}
            aria-describedby={error ? 'direct-prompt-error' : undefined}
            autoFocus
          />
          {error && (
            <p id="direct-prompt-error" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <div role="radiogroup" aria-label="What to generate" className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map((option) => {
            const selected = option.id === kind
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setKind(option.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <Icon className={cn('w-4 h-4', selected ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
                <span>
                  <span className={cn('block text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                    {option.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </button>
            )
          })}
        </div>

        {kind === 'image' && (
          <TierPicker
            tier={imageTier}
            onTierChange={setImageTier}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            disabled={isStarting}
          />
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">⌘ + Enter to generate</p>
          <Button onClick={() => void handleGenerate()} disabled={isStarting}>
            {isStarting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Generate
            {!isStarting && <ArrowRight className="ml-2 h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Need a brand-grounded brief and client review?{' '}
        <Link to="/app/campaigns/new" className="font-medium text-primary hover:underline">
          Create a campaign instead
        </Link>
      </p>
    </div>
  )
}
