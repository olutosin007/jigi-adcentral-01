import {
  Badge as RadixBadge,
  Button as RadixButton,
  Callout as RadixCallout,
  Card as RadixCard,
} from '@radix-ui/themes'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { JOURNEY_COLORS } from './tokens'
import { CALLOUT_TONES, TONE_DOT_CLASSES, TONE_SURFACE_CLASSES, type CalloutIntent, type ToneColor } from './tones'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

const RADIX_BUTTON_VARIANT = {
  primary: 'solid',
  secondary: 'soft',
  outline: 'outline',
  ghost: 'ghost',
  destructive: 'solid',
} as const

const RADIX_SIZE = { sm: '1', md: '2', lg: '3' } as const

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<typeof RadixButton>, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant
  size?: ButtonSize
}

/** Orchid is the only action colour; destructive uses Brick. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, ...props },
  ref
) {
  return (
    <RadixButton
      ref={ref}
      variant={RADIX_BUTTON_VARIANT[variant]}
      size={RADIX_SIZE[size]}
      color={variant === 'secondary' || variant === 'ghost' ? 'gray' : undefined}
      highContrast={variant === 'secondary' || variant === 'ghost'}
      data-variant={variant}
      className={cn(
        'font-sans font-semibold',
        variant === 'destructive' && 'bg-brick text-white hover:bg-brick-text',
        className
      )}
      {...props}
    />
  )
})

export interface ToneBadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone: ToneColor
  /** Show a solid dot before the label. */
  dot?: boolean
  size?: 'sm' | 'md'
}

export function ToneBadge({ tone, dot, size = 'sm', className, children, ...props }: ToneBadgeProps) {
  return (
    <RadixBadge
      asChild
      data-tone={tone}
      className={cn(
        'inline-flex items-center rounded-full border font-sans font-medium whitespace-nowrap',
        size === 'sm' ? 'gap-1 px-2 py-0.5 text-[0.6875rem]' : 'gap-1.5 px-2.5 py-0.5 text-xs',
        TONE_SURFACE_CLASSES[tone],
        className
      )}
    >
      <span {...props}>
        {dot && <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT_CLASSES[tone])} />}
        {children}
      </span>
    </RadixBadge>
  )
}

export type Journey = keyof typeof JOURNEY_COLORS

const JOURNEY_LABEL: Record<Journey, string> = { brand_first: 'Brand-first', idea_first: 'Idea-first' }

export function JourneyBadge({ journey, className }: { journey: Journey; className?: string }) {
  return (
    <ToneBadge tone={JOURNEY_COLORS[journey]} dot className={className}>
      {JOURNEY_LABEL[journey]}
    </ToneBadge>
  )
}

export interface CalloutProps {
  intent?: CalloutIntent
  icon?: ReactNode
  title?: ReactNode
  children: ReactNode
  className?: string
}

export function Callout({ intent = 'info', icon, title, children, className }: CalloutProps) {
  const tone = CALLOUT_TONES[intent]
  return (
    <RadixCallout.Root
      role={intent === 'danger' ? 'alert' : 'status'}
      data-intent={intent}
      className={cn('rounded-lg border font-sans', TONE_SURFACE_CLASSES[tone], className)}
    >
      {icon && <RadixCallout.Icon>{icon}</RadixCallout.Icon>}
      <RadixCallout.Text className="text-sm text-inherit">
        {title && <strong className="block font-semibold">{title}</strong>}
        {children}
      </RadixCallout.Text>
    </RadixCallout.Root>
  )
}

export interface PanelProps extends ComponentPropsWithoutRef<'div'> {
  /** `raised` adds the card shadow; `flat` is border-only for dense layouts. */
  elevation?: 'flat' | 'raised'
}

export function Panel({ elevation = 'raised', className, ...props }: PanelProps) {
  return (
    <RadixCard
      asChild
      variant="surface"
      className={cn('bg-card text-card-foreground', elevation === 'raised' && 'shadow-card', className)}
    >
      <div {...props} />
    </RadixCard>
  )
}
