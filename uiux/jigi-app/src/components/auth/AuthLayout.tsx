import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.06),transparent)] pointer-events-none" aria-hidden />
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="text-center">
            <Logo size="lg" className="inline-flex mb-8 justify-center transition-opacity hover:opacity-90" />

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Jigi. All rights reserved.</p>
      </footer>
    </div>
  )
}
