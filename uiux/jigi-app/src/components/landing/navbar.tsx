import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/Logo"

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#roi" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Preview new design
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="transition-colors active:scale-[0.98]"
            asChild
          >
            <Link to="/login">Log in</Link>
          </Button>
          <Button size="sm" className="transition-colors active:scale-[0.98]" asChild>
            <Link to="/app/dashboard">Start free</Link>
          </Button>
        </div>

        {/* Mobile menu toggle - 44px touch target */}
        <button
          className="flex size-11 items-center justify-center text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 border-b border-border bg-background px-4 pb-6 sm:px-6 md:hidden">
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/"
                className="flex min-h-11 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                View current design
              </Link>
              <div className="mt-4 flex flex-col gap-2">
                <Button variant="outline" size="sm" className="min-h-11" asChild>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                </Button>
                <Button size="sm" className="min-h-11" asChild>
                  <Link to="/app/dashboard" onClick={() => setMobileOpen(false)}>
                    Start free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
