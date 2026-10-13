import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type HeadingProps = ComponentPropsWithoutRef<'h1'>

/**
 * Krona One is single-weight and wide: always `font-normal` (no faux bold),
 * tightened tracking, and balanced wrapping so long titles stay tidy.
 */
const DISPLAY_BASE = 'font-display font-normal tracking-[-0.02em] text-foreground text-balance'

/** Landing hero and campaign titles — 36px. */
export function DisplayTitle({ className, ...props }: HeadingProps) {
  return <h1 className={cn(DISPLAY_BASE, 'text-[1.75rem] leading-[1.15] sm:text-4xl', className)} {...props} />
}

/** One per page — 24px. Clamped to two lines. */
export function PageTitle({ className, ...props }: HeadingProps) {
  return <h1 className={cn(DISPLAY_BASE, 'text-2xl leading-tight line-clamp-2', className)} {...props} />
}

/** Section headers stay in Source Sans — Krona is too wide below 20px. */
export function SectionTitle({ className, ...props }: ComponentPropsWithoutRef<'h2'>) {
  return <h2 className={cn('font-sans text-lg font-semibold text-foreground', className)} {...props} />
}

/** Uppercase label above a title or for table headers. */
export function Eyebrow({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn('font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground', className)}
      {...props}
    />
  )
}
