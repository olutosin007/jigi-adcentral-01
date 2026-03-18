import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { PainToOutcome } from '@/components/landing/pain-to-outcome'
import { HowItWorks } from '@/components/landing/how-it-works'
import { FeatureGrid } from '@/components/landing/feature-grid'
import { DualJourney } from '@/components/landing/dual-journey'
import { Testimonials } from '@/components/landing/testimonials'
import { ROISection } from '@/components/landing/roi-section'
import { FinalCTA } from '@/components/landing/final-cta'
import { Footer } from '@/components/landing/footer'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'

function AnimateSection({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: '0px 0px -80px 0px' })
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 motion-reduce:transition-none',
        inView
          ? 'translate-y-0 opacity-100'
          : 'translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <AnimateSection>
          <PainToOutcome />
        </AnimateSection>
        <AnimateSection>
          <HowItWorks />
        </AnimateSection>
        <AnimateSection>
          <FeatureGrid />
        </AnimateSection>
        <AnimateSection>
          <DualJourney />
        </AnimateSection>
        <AnimateSection>
          <Testimonials />
        </AnimateSection>
        <AnimateSection>
          <ROISection />
        </AnimateSection>
        <AnimateSection>
          <FinalCTA />
        </AnimateSection>
      </main>
      <Footer />
    </div>
  )
}
