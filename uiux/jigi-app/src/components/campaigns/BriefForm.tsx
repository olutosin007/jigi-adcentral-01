import { useFormContext } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CHANNEL_OPTIONS, CHANNEL_CATEGORIES, TONE_OPTIONS } from '@/store/campaignStore'
import { BriefReferenceUpload } from './BriefReferenceUpload'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface BriefFormProps {
  showChannels?: boolean
  /** Campaign ID for reference asset uploads. Only set when editing existing campaign. */
  campaignId?: string
  /** Callback when files are selected but not yet uploaded (create flow, no campaignId). */
  onPendingReferenceFilesChange?: (files: File[]) => void
}

export function BriefForm({ showChannels = true, campaignId, onPendingReferenceFilesChange }: BriefFormProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext()
  const selectedChannels = watch('channels') || []
  const selectedTones = (watch('tone_override') || []) as string[]

  const toggleChannel = (channel: string) => {
    const current = selectedChannels as string[]
    if (current.includes(channel)) {
      setValue('channels', current.filter(c => c !== channel), { shouldValidate: true })
    } else {
      setValue('channels', [...current, channel], { shouldValidate: true })
    }
  }

  const toggleTone = (tone: string) => {
    const current = selectedTones
    if (current.includes(tone)) {
      setValue('tone_override', current.filter(t => t !== tone), { shouldValidate: true })
    } else {
      setValue('tone_override', [...current, tone], { shouldValidate: true })
    }
  }

  return (
    <div className="space-y-8" data-tour="brief-form">
      <div className="space-y-2">
        <Label htmlFor="objective">
          Campaign Objective <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="objective"
          placeholder="What do you want this campaign to achieve? e.g., 'Drive awareness for our summer collection targeting young professionals'"
          {...register('objective')}
          rows={3}
          className={errors.objective ? 'border-destructive' : ''}
        />
        {errors.objective && (
          <p className="text-sm text-destructive">{errors.objective.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience">
          Target Audience <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="audience"
          placeholder="Describe your target audience: demographics, interests, behaviors, pain points..."
          {...register('audience')}
          rows={3}
          className={errors.audience ? 'border-destructive' : ''}
        />
        {errors.audience && (
          <p className="text-sm text-destructive">{errors.audience.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="key_message">
            Key Message <span className="text-destructive">*</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-label="Help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                The single message this campaign must communicate. Every concept, copy, and image will serve this.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="key_message"
          placeholder="e.g., 'Our summer collection empowers you to express your unique style'"
          {...register('key_message')}
          rows={2}
          maxLength={500}
          className={errors.key_message ? 'border-destructive' : ''}
        />
        {errors.key_message && (
          <p className="text-sm text-destructive">{errors.key_message.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">Max 500 characters</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label>Tone Override <span className="text-muted-foreground">(optional)</span></Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-label="Help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Override brand tone for this campaign. E.g. add playful or bold to the base voice.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-3">
          {TONE_OPTIONS.map((tone) => (
            <label key={tone.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedTones.includes(tone.value)}
                onCheckedChange={() => toggleTone(tone.value)}
              />
              <span className="text-sm">{tone.label}</span>
            </label>
          ))}
        </div>
      </div>

      {showChannels && (
        <div className="space-y-4">
          <div>
            <Label>
              Target Channels <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select where your creative will be published
            </p>
          </div>
          <div className="space-y-4">
            {CHANNEL_CATEGORIES.map((cat) => {
              const items = CHANNEL_OPTIONS.filter((c) => c.category === cat.id)
              if (!items.length) return null
              return (
                <div key={cat.id} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {items.map((channel) => (
                      <label
                        key={channel.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedChannels.includes(channel.value)}
                          onCheckedChange={() => toggleChannel(channel.value)}
                        />
                        <span className="text-sm">{channel.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          {errors.channels && (
            <p className="text-sm text-destructive">{errors.channels.message as string}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="requirements">
          Additional Requirements <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="requirements"
          placeholder="Any specific constraints, mandatories, or guidelines to follow..."
          {...register('requirements')}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label>Reference Assets <span className="text-muted-foreground">(optional)</span></Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-label="Help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Upload mood boards, competitor examples, or previous campaign assets to guide creative.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <BriefReferenceUpload campaignId={campaignId} onPendingFilesChange={onPendingReferenceFilesChange} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Label htmlFor="exclusions">
            Exclusions <span className="text-muted-foreground">(optional)</span>
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" aria-label="Help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                Things to avoid: competitor names, visual clichés, banned phrases, sensitive topics.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="exclusions"
          placeholder="e.g., Avoid mentioning Competitor X, no stock-photo clichés, no jargon..."
          {...register('exclusions')}
          rows={2}
          maxLength={1000}
          className={errors.exclusions ? 'border-destructive' : ''}
        />
        {errors.exclusions && (
          <p className="text-sm text-destructive">{errors.exclusions.message as string}</p>
        )}
        <p className="text-xs text-muted-foreground">Max 1000 characters</p>
      </div>
    </div>
  )
}
