import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { PageTitle } from '@/design-system'
import { Button } from '@/components/ui/button'

const TIERS = [
  {
    name: 'Studio',
    price: 49,
    blurb: 'For freelancers & small teams · 2 brands · core handoff · generation credits included',
    features: ['2 brands', 'Core handoff & Decide', 'Generation credits included', 'Email support'],
  },
  {
    name: 'Agency',
    price: 199,
    blurb: 'Multi-brand · Guest Decide · Brand Guardian · higher credits · priority support',
    features: [
      'Multi-brand workspace',
      'Guest Decide links',
      'Brand Guardian',
      'Higher generation credits',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Brand',
    price: 399,
    blurb: 'Approver seats · audit export · invite agencies · Brand Guardian',
    features: [
      'Approver seats',
      'Audit export',
      'Invite agencies',
      'Brand Guardian',
      'Handoff OS included',
    ],
  },
] as const

export function Pricing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo size="sm" />
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/pricing" className="font-medium text-orchid-11">
              Pricing
            </Link>
            <Link to="/login" className="text-slate hover:text-ink">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link to="/signup">Start free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <PageTitle>Pricing</PageTitle>
          <p className="mt-4 text-base text-slate leading-relaxed">
            On-brand drafts. Client yes. Same place. Plans for studios, agencies, and brand teams.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.name}
              className={`flex flex-col rounded-[10px] border p-6 ${
                'highlighted' in tier && tier.highlighted
                  ? 'border-orchid-8 bg-orchid-2 shadow-sm'
                  : 'border-line bg-surface'
              }`}
              data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
            >
              <h2 className="text-lg font-medium text-ink">{tier.name}</h2>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-medium tabular-nums text-ink">${tier.price}</span>
                <span className="text-sm text-slate">/ month</span>
              </p>
              <p className="mt-3 text-sm text-slate leading-relaxed">{tier.blurb}</p>
              <ul className="mt-6 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-11" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant={'highlighted' in tier && tier.highlighted ? 'default' : 'outline'}>
                <Link to="/signup">Start free</Link>
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-pewter">
          Generation compute may be metered. Prices indicative pending launch.
        </p>
      </main>
    </div>
  )
}
