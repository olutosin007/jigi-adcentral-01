import {
  ShieldCheck,
  Lightbulb,
  ListChecks,
  GitBranch,
  MessageSquareText,
  ClipboardCheck,
} from "lucide-react"

const features = [
  {
    icon: ShieldCheck,
    title: "Brand-grounded generation",
    description: "Every asset respects your uploaded brand voice, colors, and visual guidelines.",
  },
  {
    icon: Lightbulb,
    title: "Idea-first fallback",
    description: "No brand kit yet? Generate from a text idea and add brand rules when ready.",
  },
  {
    icon: ListChecks,
    title: "Structured review queue",
    description: "Clear statuses per asset: Draft, In Review, Changes Requested, Approved.",
  },
  {
    icon: GitBranch,
    title: "Version history and timeline",
    description: "Every revision tracked. See exactly what changed, when, and by whom.",
  },
  {
    icon: MessageSquareText,
    title: "Comments and change requests",
    description: "Thread-based feedback directly on each asset. No more scattered email chains.",
  },
  {
    icon: ClipboardCheck,
    title: "Approval audit trail",
    description: "Full record of who approved what and when, for compliance and transparency.",
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything teams need to ship on-brand creative
          </h2>
          <p className="mt-3 text-muted-foreground">
            Generation, governance, and review in a single system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
