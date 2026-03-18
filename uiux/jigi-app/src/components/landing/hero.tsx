import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Play } from "lucide-react"
import { ProductMockup } from "@/components/landing/product-mockup"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Background gradient instead of image for cleaner look */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center">
          {/* Pill badge */}
          <Badge
            variant="outline"
            className="mb-6 gap-2 rounded-full border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
          >
            Built for agency-brand collaboration
          </Badge>

          {/* Headline */}
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            From Idea to Approved Creative
            <span className="text-primary">{" "}Without Workflow Chaos</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Generate creative from just a text idea or your brand kit, route it through structured review, and ship approved assets faster.
          </p>

          {/* CTA pair */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="gap-2 rounded-full px-8 text-base font-semibold transition-colors active:scale-[0.98]"
              asChild
            >
              <Link to="/app/dashboard">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-full px-8 text-base font-semibold transition-colors active:scale-[0.98]"
              asChild
            >
              <a href="#cta">Book demo</a>
            </Button>
          </div>

          {/* Micro CTA */}
          <a
            href="#how-it-works"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Play className="size-3.5 fill-current" />
            Watch 2-minute walkthrough
          </a>

          {/* Product Visual */}
          <div className="mt-14 w-full max-w-4xl">
            <div className="rounded-xl border border-border bg-card p-2 shadow-lg md:p-3">
              <ProductMockup />
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {["Acme Agency", "BrightBrand", "CreativeCo", "Delta Studios", "Evergreen Media"].map(
                (name) => (
                  <span
                    key={name}
                    className="text-sm font-semibold tracking-wide text-muted-foreground/60"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
