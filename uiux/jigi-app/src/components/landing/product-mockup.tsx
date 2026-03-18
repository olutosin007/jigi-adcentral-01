import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  FileText,
  Image as ImageIcon,
} from "lucide-react"

export function ProductMockup() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
      {/* Left panel: Idea Input */}
      <div className="rounded-lg border border-border bg-background p-4 md:col-span-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Brief Input</span>
        </div>
        <div className="space-y-3">
          <div className="rounded-md bg-secondary p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {"\"Create a social media campaign for our summer product launch. Tone: energetic, young, bold.\""}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[10px] rounded-full">
              <ImageIcon className="mr-1 size-3" />
              Images
            </Badge>
            <Badge variant="outline" className="text-[10px] rounded-full">
              <FileText className="mr-1 size-3" />
              Copy
            </Badge>
          </div>
          <div className="h-8 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">Generate concepts</span>
          </div>
        </div>
      </div>

      {/* Center: Generated Concepts */}
      <div className="rounded-lg border border-border bg-background p-4 md:col-span-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Generated Assets</span>
        </div>
        <div className="space-y-2">
          {[
            { title: "Instagram carousel", status: "In Review", color: "bg-amber-100 text-amber-700" },
            { title: "Hero banner v2", status: "Approved", color: "bg-emerald-100 text-emerald-700" },
            { title: "Email header copy", status: "Changes Requested", color: "bg-red-100 text-red-600" },
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between rounded-md border border-border p-2.5">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded bg-secondary" />
                <span className="text-xs font-medium text-foreground">{item.title}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.color}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Review Sidebar */}
      <div className="rounded-lg border border-border bg-background p-4 md:col-span-4">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Review</span>
        </div>
        <div className="space-y-3">
          {/* Status timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-[11px] text-muted-foreground">Sarah approved Hero banner v2</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-3.5 text-red-500" />
              <span className="text-[11px] text-muted-foreground">Mike requested changes on email copy</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-3.5 text-amber-500" />
              <span className="text-[11px] text-muted-foreground">Instagram carousel awaiting review</span>
            </div>
          </div>
          {/* Comment box */}
          <div className="rounded-md border border-border bg-secondary p-2.5">
            <p className="text-[11px] text-muted-foreground">
              {"\"Can we try a warmer color palette for the email header? Closer to our brand autumn tones.\""}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="size-4 rounded-full bg-primary/20" />
              <span className="text-[10px] font-medium text-foreground">Mike R.</span>
              <span className="text-[10px] text-muted-foreground">2h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
