import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section id="cta" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm md:p-16">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Move from creative idea to approved asset
            <span className="text-primary"> — faster.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            No brand kit required to begin. Start generating, reviewing, and approving in one workflow today.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gap-2 rounded-full px-8 text-base font-semibold">
              Start free
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-full px-8 text-base font-semibold"
            >
              Book demo
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Free plan available. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
