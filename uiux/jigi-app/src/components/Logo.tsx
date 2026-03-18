/**
 * Jigi logo — white circle with dark "J".
 * Used across landing, app shell, and auth screens.
 */

import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type LogoSize = 'sm' | 'md' | 'lg'

const sizeClasses = {
  sm: { icon: 'w-6 h-6', j: 'text-xs', text: 'text-sm' },
  md: { icon: 'w-8 h-8', j: 'text-lg', text: 'text-lg' },
  lg: { icon: 'w-12 h-12', j: 'text-2xl', text: 'text-xl' },
} as const

interface LogoProps {
  size?: LogoSize
  showText?: boolean
  asLink?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, asLink = true, className }: LogoProps) {
  const { icon, j, text } = sizeClasses[size]

  const content = (
    <>
      <div
        className={cn(
          'rounded-full bg-white flex items-center justify-center flex-shrink-0',
          icon
        )}
      >
        <span className={cn('text-[#030303] font-serif font-bold leading-none', j)}>J</span>
      </div>
      {showText && (
        <span className={cn('font-serif font-bold tracking-wide', text)}>Jigi</span>
      )}
    </>
  )

  if (asLink) {
    return (
      <Link
        to="/"
        className={cn('flex items-center gap-2', className)}
        aria-label="Jigi home"
      >
        {content}
      </Link>
    )
  }

  return <div className={cn('flex items-center gap-2', className)}>{content}</div>
}
