/**
 * Landing V2 — Alternative landing page design.
 * All CTAs wired to match current landing: Sign In → /login, Start Free → /app/dashboard, Book Demo → #cta.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  Workflow,
  CheckCircle2,
  ArrowRight,
  Play,
  ShieldCheck,
  History,
  MessageSquare,
  FileCheck,
  Palette,
} from 'lucide-react'
import { Logo } from '@/components/Logo'

// --- Components ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-background/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Logo size="md" className="text-white" />

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#platform" className="hover:text-white transition-colors">
            Platform
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#results" className="hover:text-white transition-colors">
            Results
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            to="/app/dashboard"
            className="btn-filled px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}

const HERO_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=2564&auto=format&fit=crop',
    alt: 'Fashion Advertising Creative',
  },
  {
    url: '/images/african-lady-wearing-ankara-dress-midwalk-o__5102.png',
    alt: 'African Fashion Runway Creative',
  },
  {
    url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2564&auto=format&fit=crop',
    alt: 'Beverage Advertising Creative',
  },
]

function Hero() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 1000, 1400], [1, 1, 0])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
      <motion.div style={{ opacity }} className="absolute inset-0 z-0">
        <AnimatePresence>
          <motion.img
            key={currentIndex}
            src={HERO_IMAGES[currentIndex].url}
            alt={HERO_IMAGES[currentIndex].alt}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="hero-overlay absolute inset-0" aria-hidden />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-serif tracking-tighter leading-[0.9] mb-8"
          >
            <span className="text-gradient">Pure Imagination,</span>
            <br />
            <span className="italic text-white/80">Rendered Instantly.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mb-12 font-light leading-relaxed"
          >
            Generate production-ready creative from a single text prompt. Route it through structured
            review, and ship approved assets without the workflow chaos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
          <Link
            to="/app/dashboard"
            className="btn-filled w-full sm:w-auto px-8 py-4 rounded-full font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2 group text-[#030303]"
          >
              Start Creating
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#cta"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Book Demo
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Logos() {
  return (
    <section className="py-12 border-y border-white/5 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-medium tracking-widest uppercase text-white/40 mb-8">
          Trusted by visionary teams at
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale">
          {['Acme Agency', 'BrightBrand', 'CreativeCo', 'Delta Studios', 'Evergreen'].map((name) => (
            <div key={name} className="text-xl font-serif font-bold tracking-wider">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProblemSolution() {
  return (
    <section id="platform" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">The creative workflow is broken.</h2>
          <p className="text-lg text-white/60 font-light">
            Off-brand outputs, feedback scattered across Slack, and approval bottlenecks. We rebuilt
            the pipeline from the ground up.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:flex absolute top-16 left-[20%] right-[20%] items-center justify-between pointer-events-none z-0">
            <ArrowRight className="w-6 h-6 text-white/10" />
            <ArrowRight className="w-6 h-6 text-white/10" />
          </div>

          {[
            {
              step: 'STEP 01',
              title: 'Generate from a brief or idea',
              desc: 'Paste a creative brief, describe a concept, or drop in a rough idea. Jigi generates copy, images, and concepts instantly.',
              icon: <Sparkles className="w-6 h-6 text-[#D4AF37]" />,
            },
            {
              step: 'STEP 02',
              title: 'Align with brand constraints',
              desc: 'Apply brand guidelines, voice, and visual rules now or later. Jigi adapts outputs to match your brand without reworking earlier assets.',
              icon: <Palette className="w-6 h-6 text-[#D4AF37]" />,
            },
            {
              step: 'STEP 03',
              title: 'Review and approve with full visibility',
              desc: 'Route assets through structured review. Comment, request changes, and approve with a complete audit trail everyone can follow.',
              icon: <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="glass-panel p-8 rounded-3xl relative overflow-hidden group z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-8 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10">
                {item.icon}
              </div>
              <div className="text-xs font-bold tracking-widest uppercase text-[#D4AF37] mb-3">
                {item.step}
              </div>
              <h3 className="text-xl font-medium mb-4 text-white/90">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="py-32 bg-surface border-y border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
          <h2 className="text-4xl md:text-6xl font-serif mb-6 max-w-2xl">
            Everything required to ship <span className="italic text-white/70">on-brand</span>{' '}
            creative.
          </h2>
          <p className="text-lg text-white/50 max-w-xl font-light">
            Generation, governance, and review unified in a single, elegant system.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2 glass-panel rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 group">
            <div className="flex-1">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 border border-[#D4AF37]/20">
                <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-3xl font-serif mb-4">Brand-Grounded Generation</h3>
              <p className="text-white/60 font-light leading-relaxed mb-8">
                Upload your brand assets, define your voice, and set visual rules. Jigi ensures
                every generated concept strictly adheres to your constraints from day one.
              </p>
              <ul className="space-y-3">
                {['Custom color palettes', 'Typography enforcement', 'Tone of voice matching'].map(
                  (item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white/80">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-square md:aspect-video rounded-2xl overflow-hidden border border-white/10 relative">
                <img
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop"
                  alt="Brand Guidelines"
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 to-transparent" />
              </div>
            </div>
          </div>

          {[
            {
              icon: <Workflow className="w-5 h-5" />,
              title: 'Structured Review Queue',
              desc: 'Clear statuses per asset: Draft, In Review, Changes Requested, Approved. Never lose track of where an asset sits.',
            },
            {
              icon: <History className="w-5 h-5" />,
              title: 'Version History & Timeline',
              desc: 'Every revision tracked immutably. See exactly what changed, when, and by whom.',
            },
            {
              icon: <MessageSquare className="w-5 h-5" />,
              title: 'Contextual Feedback',
              desc: 'Thread-based feedback directly on each asset. Pin comments to specific areas of an image or video.',
            },
            {
              icon: <FileCheck className="w-5 h-5" />,
              title: 'Approval Audit Trail',
              desc: 'A full, exportable record of who approved what and when, ensuring compliance and transparency.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-panel rounded-3xl p-8 hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                {feature.icon}
              </div>
              <h4 className="text-xl font-medium mb-3">{feature.title}</h4>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section id="results" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Measurable Workflow Gains</h2>
          <p className="text-white/50">Before and after Jigi, across real team workflows.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 border-y border-white/10 py-12">
          {[
            {
              metric: '73%',
              label: 'Faster approval turnaround',
              context: 'From 5 days to under 24 hours',
            },
            {
              metric: '4x',
              label: 'Fewer feedback loops',
              context: 'Due to brand-grounded generation',
            },
            {
              metric: '2.5x',
              label: 'More assets shipped',
              context: 'Per campaign, without adding headcount',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="px-8 py-6 md:py-0 text-center flex flex-col items-center justify-center"
            >
              <div className="text-6xl font-serif font-light text-gradient-accent mb-4">
                {stat.metric}
              </div>
              <div className="text-lg font-medium mb-2">{stat.label}</div>
              <div className="text-sm text-white/40">{stat.context}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section id="cta" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#D4AF37]/5" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <h2 className="text-5xl md:text-7xl font-serif tracking-tighter mb-8">
          Move from idea to <br />
          <span className="italic text-white/70">approved asset.</span>
        </h2>
        <p className="text-xl text-white/60 font-light mb-12 max-w-2xl mx-auto">
          No brand kit required to begin. Start generating, reviewing, and approving in one workflow
          today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/app/dashboard"
            className="btn-filled px-8 py-4 rounded-full font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2 text-[#030303]"
          >
            Start Free
          </Link>
          <a
            href="#cta"
            className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition-all"
          >
            Book a Demo
          </a>
        </div>
        <p className="mt-6 text-xs text-white/40 uppercase tracking-widest">
          Exclusive access for agency partners
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-background pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 md:col-span-1">
            <Logo size="sm" className="mb-6 text-white" />
            <p className="text-sm text-white/40 max-w-xs">
              The definitive AI creative engine for visionary brands and agencies.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-6 uppercase tracking-wider text-white/80">
              Product
            </h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Enterprise
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-6 uppercase tracking-wider text-white/80">
              Resources
            </h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-6 uppercase tracking-wider text-white/80">
              Company
            </h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-white/40">
          <p>© 2026 Jigi Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function LandingV2Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <ProblemSolution />
        <Features />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
