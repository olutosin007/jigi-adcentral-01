import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CHANNEL_OPTIONS } from '@/store/campaignStore'

interface ChannelSelectorProps {
  selected: string[]
  onChange: (channels: string[]) => void
  error?: string
}

export function ChannelSelector({ selected, onChange, error }: ChannelSelectorProps) {
  const toggleChannel = (channel: string) => {
    if (selected.includes(channel)) {
      onChange(selected.filter(c => c !== channel))
    } else {
      onChange([...selected, channel])
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Target Channels <span className="text-destructive">*</span></Label>
        <p className="text-sm text-muted-foreground mt-1">
          Select where your creative will be published
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CHANNEL_OPTIONS.map((channel) => (
          <label
            key={channel.value}
            className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selected.includes(channel.value)}
              onCheckedChange={() => toggleChannel(channel.value)}
            />
            <span className="text-sm">{channel.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
