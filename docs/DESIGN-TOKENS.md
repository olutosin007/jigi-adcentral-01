# Jigi Design Tokens

This document describes the design tokens used across the Jigi app. All UI components should use these tokens instead of hardcoded hex values or raw Tailwind color utilities (e.g. `gray-500`, `teal-600`) where semantic alternatives exist.

## Core Tokens

Defined in `src/styles/globals.css` under `:root` and `.dark`.

### Background & Foreground

| Token | Usage | Light | Dark |
|-------|-------|-------|------|
| `--background` | Page/screen background | #FEFDFB | #1C1917 |
| `--foreground` | Primary text | #1C1917 | #F5F0EB |
| `--card` | Card backgrounds | #FFFFFF | #292524 |
| `--card-foreground` | Text on cards | #1C1917 | #F5F0EB |
| `--muted` | Muted backgrounds (inputs, secondary areas) | #F5F0EB | #44403C |
| `--muted-foreground` | Secondary text, placeholders | #78716C | #A8A29E |

**Tailwind classes:** `bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`

### Primary (Brand)

| Token | Usage | Light | Dark |
|-------|-------|-------|------|
| `--primary` | Brand accent, CTAs, links | #0D9488 | #0D9488 |
| `--primary-foreground` | Text on primary backgrounds | #FFFFFF | #FFFFFF |

**Tailwind classes:** `bg-primary`, `text-primary`, `bg-primary/10`, `border-primary/30`, `hover:bg-primary/90`

### Semantic (Status)

| Token | Usage | Light |
|-------|-------|-------|
| `--destructive` | Errors, reject, delete actions | #EF4444 |
| `--success` | Approved, pass, success states | #16A34A |
| `--warning` | Changes requested, warnings | #D97706 |
| `--error` | Error states (alias for destructive) | #DC2626 |

**Tailwind classes:** `text-destructive`, `bg-destructive/10`, `text-success`, `bg-success/10`, `text-warning`, `bg-warning/10`

### Borders & Inputs

| Token | Usage |
|-------|-------|
| `--border` | Borders, dividers |
| `--input` | Input borders |
| `--ring` | Focus rings |

**Tailwind classes:** `border-border`, `border-input`, `ring-ring`

### Sidebar (Shell)

| Token | Usage |
|-------|-------|
| `--sidebar` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Active nav item |
| `--sidebar-accent` | Hover state |
| `--sidebar-border` | Sidebar borders |

## Usage Guidelines

### When to use each token

- **`text-foreground`** – Primary headings and body text
- **`text-muted-foreground`** – Secondary text, captions, placeholders
- **`bg-muted`** – Secondary backgrounds (skeleton, disabled areas, list item hover)
- **`bg-card`** – Card surfaces (use `bg-background` for page-level)
- **`border-border`** – All borders (avoid `border-gray-200`, etc.)
- **`text-primary`** – Links, primary accents, “in progress” status
- **`text-success`** – Approved, pass, positive outcomes
- **`text-warning`** – Changes requested, pending attention
- **`text-destructive`** – Rejected, errors, delete, required field markers
- **`bg-primary/10`** – Light primary tint (e.g. status badges, highlights)
- **`bg-destructive/10`** – Light error/warning tint
- **`bg-success/10`** – Light success tint
- **`bg-warning/10`** – Light warning tint

### Opacity variants

Use `/10`, `/20`, `/30`, `/50`, `/80`, `/90` for opacity:

- `bg-primary/10` – Light primary background
- `border-primary/30` – Subtle primary border
- `hover:bg-primary/90` – Hover state

### Chart colors

For data visualizations and non-semantic accents:

- `chart-1` through `chart-5` – Use for gradients and data series

## Status Mapping

| Status | Token | Example |
|--------|-------|---------|
| Draft | `muted`, `muted-foreground` | `bg-muted text-muted-foreground` |
| Submitted / In progress | `primary` | `bg-primary/10 text-primary` |
| Changes requested | `warning` | `bg-warning/10 text-warning` |
| Approved | `success` | `bg-success/10 text-success` |
| Rejected | `destructive` | `bg-destructive/10 text-destructive` |

## Dark Mode

Tokens automatically switch in `.dark`. Ensure:

1. No hardcoded hex in UI components
2. Use tokens for all colors
3. Test both light and dark themes on major routes

## Exclusions

- **Email templates** (`lib/email/templates/`) – Use inline hex for email client compatibility
- **Brand/identity colours** – User-defined brand colours (e.g. `colours.primary`) may use hex fallbacks
- **Color pickers** – `#000000` for contrast calculation is acceptable
