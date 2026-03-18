import '@/styles/landing-v2.css'
import { LandingV2Page } from '@/components/landing-v2/LandingV2Page'

export function LandingV2() {
  return (
    <div className="landing-v2-theme min-h-screen bg-background text-white selection:bg-[#D4AF37]/30">
      <LandingV2Page />
    </div>
  )
}
