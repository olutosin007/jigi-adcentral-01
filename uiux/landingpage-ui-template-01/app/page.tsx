import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { PainToOutcome } from "@/components/pain-to-outcome"
import { HowItWorks } from "@/components/how-it-works"
import { DualJourney } from "@/components/dual-journey"
import { FeatureGrid } from "@/components/feature-grid"
import { Testimonials } from "@/components/testimonials"
import { ROISection } from "@/components/roi-section"
import { FinalCTA } from "@/components/final-cta"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainToOutcome />
        <HowItWorks />
        <DualJourney />
        <FeatureGrid />
        <Testimonials />
        <ROISection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
