import { Palette, Lightbulb, ArrowRight } from "lucide-react"

export function DualJourney() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Start where you are
          </h2>
          <p className="mt-3 max-w-lg mx-auto text-muted-foreground">
            Whether you have a full brand kit or just a napkin idea, Jigi meets you there.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Brand-First */}
          <div className="group relative rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Palette className="size-5 text-primary" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">Brand-First</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Upload brand assets, define voice and visual rules, then generate with strict constraints from day one.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
              Full brand control from the start
              <ArrowRight className="size-3.5" />
            </div>
          </div>

          {/* Idea-First */}
          <div className="group relative rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Lightbulb className="size-5 text-primary" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-foreground">Idea-First</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Start with a text idea right now and generate immediately. Retrofit brand guidelines later without reworking your pipeline.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
              No brand kit? No problem
              <ArrowRight className="size-3.5" />
            </div>
          </div>
        </div>

        {/* Convergence note */}
        <div className="mt-8 flex items-center justify-center gap-3 text-center">
          <div className="h-px flex-1 max-w-20 bg-border" />
          <p className="text-sm font-medium text-muted-foreground">
            Both journeys converge into the same structured review and approval pipeline.
          </p>
          <div className="h-px flex-1 max-w-20 bg-border" />
        </div>
      </div>
    </section>
  )
}
