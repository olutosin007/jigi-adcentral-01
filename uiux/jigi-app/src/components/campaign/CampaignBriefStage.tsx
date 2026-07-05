import { Pencil, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ReferenceAssetUploadInline } from '@/components/campaigns/ReferenceAssetUploadInline'
import { CHANNEL_OPTIONS, TONE_OPTIONS } from '@/store/campaignStore'
import type { Campaign } from '@/store/campaignStore'

export interface BriefFormData {
  objective: string
  audience: string
  channels: string[]
  requirements: string
  key_message: string
  tone_override: string[]
  reference_assets: { file_url: string; filename?: string }[]
  exclusions: string
}

interface CampaignBriefStageProps {
  campaign: Campaign
  campaignId: string
  brief: NonNullable<Campaign['brief']> | Record<string, never>
  isEditing: boolean
  briefData: BriefFormData | null
  onStartEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  onBriefDataChange: (updater: (prev: BriefFormData | null) => BriefFormData | null) => void
}

export function CampaignBriefStage({
  campaign,
  campaignId,
  brief,
  isEditing,
  briefData,
  onStartEdit,
  onCancelEdit,
  onSave,
  onBriefDataChange,
}: CampaignBriefStageProps) {
  return (
    <div className="p-6 md:p-8 overflow-y-auto h-full">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Campaign Brief</h2>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave}>
                <Save className="w-3.5 h-3.5 mr-1" />
                Save
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={onStartEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {campaign.seed_idea && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Seed Idea
            </label>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-100 italic">
                &quot;{campaign.seed_idea}&quot;
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Objective
          </label>
          {isEditing ? (
            <Textarea
              value={briefData?.objective || ''}
              onChange={(e) =>
                onBriefDataChange((prev) => prev && { ...prev, objective: e.target.value })
              }
              placeholder="What do you want this campaign to achieve?"
              rows={3}
            />
          ) : (
            <p className="text-sm text-foreground">
              {brief.objective || <span className="text-muted-foreground italic">Not specified</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Target Audience
          </label>
          {isEditing ? (
            <Textarea
              value={briefData?.audience || ''}
              onChange={(e) =>
                onBriefDataChange((prev) => prev && { ...prev, audience: e.target.value })
              }
              placeholder="Describe your target audience"
              rows={3}
            />
          ) : (
            <p className="text-sm text-foreground">
              {brief.audience || <span className="text-muted-foreground italic">Not specified</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Key Message
          </label>
          {isEditing ? (
            <Textarea
              value={briefData?.key_message || ''}
              onChange={(e) =>
                onBriefDataChange((prev) => prev && { ...prev, key_message: e.target.value })
              }
              placeholder="The single message this campaign must communicate"
              rows={2}
              maxLength={500}
            />
          ) : (
            <p className="text-sm text-foreground">
              {brief.key_message || <span className="text-muted-foreground italic">Not specified</span>}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Tone Override
          </label>
          {isEditing ? (
            <div className="flex flex-wrap gap-3">
              {TONE_OPTIONS.map((tone) => (
                <label key={tone.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={briefData?.tone_override?.includes(tone.value)}
                    onCheckedChange={(checked) => {
                      onBriefDataChange((prev) => {
                        if (!prev) return prev
                        const tones = checked
                          ? [...(prev.tone_override || []), tone.value]
                          : prev.tone_override?.filter((t) => t !== tone.value) || []
                        return { ...prev, tone_override: tones }
                      })
                    }}
                  />
                  <span className="text-sm text-foreground">{tone.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brief.tone_override?.length ? (
                brief.tone_override.map((t) => {
                  const opt = TONE_OPTIONS.find((o) => o.value === t)
                  return (
                    <Badge key={t} variant="secondary">
                      {opt?.label || t}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-sm text-muted-foreground italic">None selected</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Channels
          </label>
          {isEditing ? (
            <div className="flex flex-wrap gap-3">
              {CHANNEL_OPTIONS.map((ch) => (
                <label key={ch.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={briefData?.channels?.includes(ch.value)}
                    onCheckedChange={(checked) => {
                      onBriefDataChange((prev) => {
                        if (!prev) return prev
                        const channels = checked
                          ? [...(prev.channels || []), ch.value]
                          : prev.channels?.filter((c) => c !== ch.value) || []
                        return { ...prev, channels }
                      })
                    }}
                  />
                  <span className="text-sm text-foreground">{ch.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brief.channels?.length ? (
                brief.channels.map((ch: string) => {
                  const channel = CHANNEL_OPTIONS.find((c) => c.value === ch)
                  return (
                    <Badge key={ch} variant="secondary">
                      {channel?.label || ch}
                    </Badge>
                  )
                })
              ) : (
                <span className="text-sm text-muted-foreground italic">None selected</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Additional Requirements
          </label>
          {isEditing ? (
            <Textarea
              value={briefData?.requirements || ''}
              onChange={(e) =>
                onBriefDataChange((prev) => prev && { ...prev, requirements: e.target.value })
              }
              placeholder="Any specific constraints or guidelines"
              rows={3}
            />
          ) : (
            <p className="text-sm text-foreground">
              {brief.requirements || (
                <span className="text-muted-foreground italic">None specified</span>
              )}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Reference Assets
          </label>
          {isEditing ? (
            <ReferenceAssetUploadInline
              campaignId={campaignId}
              value={briefData?.reference_assets || []}
              onChange={(assets) =>
                onBriefDataChange((prev) => prev && { ...prev, reference_assets: assets })
              }
            />
          ) : (
            <div className="space-y-2">
              {brief.reference_assets?.length ? (
                brief.reference_assets.map((a) => (
                  <a
                    key={a.file_url}
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-primary hover:underline truncate"
                  >
                    {a.filename || 'Reference'}
                  </a>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">None uploaded</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Exclusions
          </label>
          {isEditing ? (
            <Textarea
              value={briefData?.exclusions || ''}
              onChange={(e) =>
                onBriefDataChange((prev) => prev && { ...prev, exclusions: e.target.value })
              }
              placeholder="Things to avoid: competitor names, clichés, banned phrases..."
              rows={2}
              maxLength={1000}
            />
          ) : (
            <p className="text-sm text-foreground">
              {brief.exclusions || (
                <span className="text-muted-foreground italic">None specified</span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
