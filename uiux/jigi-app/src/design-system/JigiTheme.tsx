import { Theme } from '@radix-ui/themes'
import type { ReactNode } from 'react'

/**
 * Radix Themes root. Orchid replaces Radix `iris` and Sage replaces `green`
 * (see jigi-theme.css), so `accentColor="iris"` renders Jigi's brand.
 * The body owns the canvas colour, hence `hasBackground={false}`.
 */
export function JigiTheme({ children }: { children: ReactNode }) {
  return (
    <Theme accentColor="iris" grayColor="mauve" radius="medium" scaling="100%" hasBackground={false}>
      {children}
    </Theme>
  )
}
