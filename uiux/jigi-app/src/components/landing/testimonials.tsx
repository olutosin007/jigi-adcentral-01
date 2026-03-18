import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "We cut our approval turnaround from 5 days to under 24 hours. Jigi gave us a single place to generate, review, and approve without the usual back-and-forth.",
    name: "Lauren Chen",
    role: "Head of Creative, BrightBrand",
    initials: "LC",
  },
  {
    quote:
      "Our team started using Jigi without any brand assets. Within a week, we retrofitted our guidelines and the quality jump was immediate. No rework needed.",
    name: "Marcus Reid",
    role: "Performance Lead, Acme Agency",
    initials: "MR",
  },
  {
    quote:
      "The audit trail alone was worth the switch. Our compliance team can see exactly who approved what, and our creative team moves 3x faster.",
    name: "Priya Sharma",
    role: "VP Marketing, Delta Studios",
    initials: "PS",
  },
]

const metrics = [
  { value: "73%", label: "faster approval turnaround" },
  { value: "4x", label: "fewer feedback loops" },
  { value: "2.5x", label: "more assets shipped per campaign" },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Teams ship better creative, faster
          </h2>
          <p className="mt-3 text-muted-foreground">
            Hear from the agencies and brands already using Jigi.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-primary text-primary"
                  />
                ))}
              </div>
              <p className="flex-1 text-sm leading-relaxed text-foreground">
                {`"${t.quote}"`}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metrics row */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm"
            >
              <span className="text-3xl font-extrabold text-primary">{m.value}</span>
              <span className="mt-1 text-sm text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
