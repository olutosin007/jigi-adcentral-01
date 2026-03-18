import { ArrowRight } from "lucide-react"

const comparisons = [
  {
    metric: "Time to first draft",
    before: "2-3 days",
    after: "Under 10 minutes",
  },
  {
    metric: "Time to approval",
    before: "5-7 days",
    after: "Under 24 hours",
  },
  {
    metric: "Revision rounds",
    before: "4-6 rounds",
    after: "1-2 rounds",
  },
]

export function ROISection() {
  return (
    <section id="roi" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Measurable workflow gains
          </h2>
          <p className="mt-3 text-muted-foreground">
            Before and after Jigi, across real team workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {comparisons.map((c) => (
            <div
              key={c.metric}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {c.metric}
              </h3>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex-1 rounded-lg bg-red-50 px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-red-600">{c.before}</span>
                </div>
                <ArrowRight className="size-4 shrink-0 text-primary" />
                <div className="flex-1 rounded-lg bg-emerald-50 px-4 py-3 text-center">
                  <span className="text-sm font-semibold text-emerald-700">{c.after}</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Without Jigi</span>
                <span>With Jigi</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
