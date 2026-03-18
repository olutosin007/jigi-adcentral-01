import { ArrowDown } from "lucide-react"

const painCards = [
  {
    pain: "AI outputs feel off-brand",
    outcome: "Generate creative grounded in your brand voice, colors, and guidelines.",
  },
  {
    pain: "Feedback scattered across email and Slack",
    outcome: "Centralized comments, change requests, and approval history in one place.",
  },
  {
    pain: "Approvals take too long",
    outcome: "Structured review queues with clear statuses so nothing stalls.",
  },
]

export function PainToOutcome() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Sound familiar?
          </h2>
          <p className="mt-3 text-muted-foreground">
            The creative workflow problems teams deal with every day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {painCards.map((card) => (
            <div
              key={card.pain}
              className="group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Pain */}
              <div className="rounded-lg bg-red-50 px-4 py-2.5">
                <p className="text-sm font-semibold text-red-600">{card.pain}</p>
              </div>

              <ArrowDown className="my-4 size-4 text-muted-foreground/50" />

              {/* Outcome */}
              <div className="rounded-lg bg-emerald-50 px-4 py-2.5">
                <p className="text-sm font-medium text-emerald-700">{card.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
