import { Sparkles, Palette, CheckCircle } from "lucide-react"

const steps = [
  {
    step: "01",
    icon: Sparkles,
    title: "Generate from a brief or idea",
    description:
      "Paste a creative brief, describe a concept, or drop in a rough idea. Jigi generates copy, images, and concepts instantly.",
  },
  {
    step: "02",
    icon: Palette,
    title: "Align with brand constraints",
    description:
      "Apply brand guidelines, voice, and visual rules now or later. Jigi adapts outputs to match your brand without reworking earlier assets.",
  },
  {
    step: "03",
    icon: CheckCircle,
    title: "Review and approve with full visibility",
    description:
      "Route assets through structured review. Comment, request changes, and approve with a complete audit trail everyone can follow.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three steps from creative idea to approved asset.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((item, idx) => (
            <div key={item.step} className="relative flex flex-col items-start">
              {/* Connection arrow (desktop) */}
              {idx < steps.length - 1 && (
                <div className="absolute right-0 top-10 hidden -translate-y-1/2 translate-x-1/2 md:block">
                  <svg
                    width="40"
                    height="12"
                    viewBox="0 0 40 12"
                    fill="none"
                    className="text-border"
                  >
                    <path
                      d="M0 6H36M36 6L30 1M36 6L30 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="size-5 text-primary" />
              </div>

              <span className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">
                Step {item.step}
              </span>

              <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
