# Sprint 01 — Project Setup & UI Foundation

**Duration:** Week 1 (5 days)  
**Phase:** Foundation (1 of 3)  
**Goal:** Establish the complete development environment, UI component library, and deploy a working shell application

---

## Sprint Objectives

1. Create and configure the monorepo structure
2. Set up all external services (Supabase, Vercel)
3. **Build the core UI component library**
4. **Build the application shell layout (sidebar, header, navigation)**
5. Build the base React application with routing
6. Deploy first version to production
7. Prepare routing and state scaffolding for both Brand-First and Idea-First journeys

---

## Deliverables

### Day 1: Repository & Monorepo Structure

- [ ] Create GitHub repository: `jigi`
- [ ] Initialize pnpm workspace
- [ ] Set up `apps/web` with Vite + React 19 + TypeScript
- [ ] Set up `packages/api` structure for serverless functions
- [ ] Create `.gitignore`, `.nvmrc`, `pnpm-workspace.yaml`
- [ ] Create `.env.example` with all environment variables

**Files to create:**
```
jigi/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   └── index.css
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── api/
│       ├── lib/
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .nvmrc
└── .env.example
```

### Day 2: Tailwind & Design System Setup

- [ ] Configure Tailwind CSS 4.0
- [ ] Set up design system tokens (colors, typography, spacing)
- [ ] Create `tailwind.config.ts` with full Jigi theme
- [ ] Install and configure Lucide React icons
- [ ] Create CSS variables for theming
- [ ] Set up dark mode support (optional toggle)
- [ ] **Install all accelerating libraries for the project**

**Reference:** Section 14 (UI Design System) in project specification

**Design System Files:**
```
src/
├── styles/
│   ├── globals.css          # Tailwind imports + CSS variables
│   └── design-tokens.ts     # Exportable token values
```

**Install All Accelerating Libraries (Full Project):**

These libraries are used across multiple sprints. Install them now to avoid repeated setup:

```bash
# Core form handling (Sprints 02, 03, 04)
pnpm add react-hook-form @hookform/resolvers zod

# Data fetching & caching (Sprints 05, 06, 07, 08, 09)
pnpm add @tanstack/react-query

# Colour extraction for brand onboarding (Sprint 03)
pnpm add colorthief

# Email templates (Sprint 08)
pnpm add @react-email/components
```

**Summary of Accelerating Libraries:**
| Library | Size | Sprints Used | Purpose |
|---------|------|--------------|---------|
| `react-hook-form` | ~8KB | 02, 03, 04 | Forms with validation |
| `@hookform/resolvers` | ~1KB | 02, 03, 04 | Zod integration |
| `zod` | ~2KB | 02, 03, 04 | Schema validation |
| `@tanstack/react-query` | ~12KB | 05, 06, 07, 08, 09 | Data fetching & caching |
| `colorthief` | ~3KB | 03 | Logo colour extraction |
| `@react-email/components` | 0KB runtime | 08 | Email templates |

**Total additional bundle: ~26KB** (only ~23KB client-side, react-email is server-only)

### Day 3: Core UI Component Library (using shadcn/ui)

Use **shadcn/ui** to scaffold foundational components. shadcn/ui copies component code directly into your project—no runtime dependency, full control, accessible by default.

**Install shadcn/ui CLI:**
```bash
pnpm dlx shadcn@latest init
```

**Configuration choices:**
- Style: Default
- Base color: Slate (we'll customize to Jigi palette)
- CSS variables: Yes
- Tailwind config: tailwind.config.ts
- Components path: src/components/ui
- Utils path: src/lib/utils

**Add core components:**
```bash
pnpm dlx shadcn@latest add button input textarea select checkbox card badge avatar skeleton
```

- [ ] Install shadcn/ui CLI and initialize
- [ ] Add Button, Input, Textarea, Select, Checkbox components
- [ ] Add Card, Badge, Avatar, Skeleton components
- [ ] Customize colors to Jigi design system (teal accent, warm background)
- [ ] Create custom Spinner component (shadcn doesn't include one)
- [ ] Test all components render correctly with Jigi theme

**After shadcn installation, customize:**
```typescript
// Update src/lib/utils.ts to use Jigi colors
// Modify component variants to match Jigi design system
// Badge: Add status variants (draft, pending, approved, rejected)
```

**UI Components Structure (after shadcn):**
```
src/components/ui/
├── button.tsx       # From shadcn
├── input.tsx        # From shadcn
├── textarea.tsx     # From shadcn
├── select.tsx       # From shadcn
├── checkbox.tsx     # From shadcn
├── card.tsx         # From shadcn
├── badge.tsx        # From shadcn, customize variants
├── avatar.tsx       # From shadcn
├── skeleton.tsx     # From shadcn
├── spinner.tsx      # Custom (simple Tailwind component)
└── index.ts
```

### Day 4: Layout Components & Patterns (using shadcn/ui)

Continue with shadcn/ui for dialog, toast, dropdown, and tooltip. Build custom layout components.

**Add shadcn pattern components:**
```bash
pnpm dlx shadcn@latest add dialog dropdown-menu tooltip popover sonner
```

Note: shadcn uses **Sonner** for toasts (lightweight, beautiful by default).

- [ ] Add Dialog, DropdownMenu, Tooltip, Popover components from shadcn
- [ ] Add Sonner for toast notifications
- [ ] Build custom **AppLayout** component (sidebar + main content)
- [ ] Build custom **Sidebar** component with navigation
- [ ] Build custom **Header** component with breadcrumbs
- [ ] Build custom **PageHeader** component
- [ ] Build custom **EmptyState** component
- [ ] Configure Sonner toast provider in App.tsx

**Layout Components Structure:**
```
src/components/layout/
├── AppLayout.tsx      # Custom: wraps sidebar + content
├── Sidebar.tsx        # Custom: navigation sidebar
├── Header.tsx         # Custom: top bar
├── PageHeader.tsx     # Custom: page title + actions
└── index.ts

src/components/ui/
├── ... (Day 3 components)
├── dialog.tsx         # From shadcn
├── dropdown-menu.tsx  # From shadcn
├── tooltip.tsx        # From shadcn
├── popover.tsx        # From shadcn
├── sonner.tsx         # From shadcn (toast wrapper)
├── empty-state.tsx    # Custom
└── index.ts
```

**Toast Setup (using Sonner):**
```typescript
// In App.tsx or layout
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  )
}

// Usage anywhere in app
import { toast } from 'sonner'
toast.success('Asset approved!')
toast.error('Something went wrong')
```

**Sidebar Navigation Items:**
```typescript
const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Palette, label: 'Brands', href: '/brands' },
  { icon: FolderOpen, label: 'Campaigns', href: '/campaigns' },
  { icon: CheckCircle, label: 'Review', href: '/review' },
  { icon: Archive, label: 'Approved', href: '/approved' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]
```

### Day 5: Routing, Supabase & Deployment

- [ ] Install and configure React Router 7
- [ ] Create route structure for MVP pages
- [ ] Create placeholder pages for all routes
- [ ] Implement navigation in sidebar
- [ ] Add journey entry placeholders: "Start with Brand" and "Generate from Idea"
- [ ] Create Supabase project (jigi-mvp)
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client (`src/lib/supabase.ts`)
- [ ] Create Vercel project and deploy
- [ ] Verify deployment works

**Routes to implement:**
```
/                     → Dashboard (protected)
/login                → Login page
/signup               → Signup page
/quick-start          → Idea-first text prompt intake (protected)
/onboarding           → Onboarding wizard (protected)
/brands               → Brand list (protected)
/brands/:id           → Brand profile (protected)
/campaigns            → Campaign list (protected)
/campaigns/:id        → Campaign detail (protected)
/campaigns/new        → Campaign creation (protected)
/review               → Review queue (protected)
/review/:assetId      → Asset review (protected)
/approved             → Approved assets (protected)
/settings             → Settings (protected)
```

**Journey entry requirement:**
- From post-auth setup, users can choose:
  - **Brand-First:** Continue to onboarding wizard
  - **Idea-First:** Continue to `quick-start` and create first campaign from text

---

## Technical Notes

### Vite Configuration

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Tailwind Setup

Use Tailwind CSS 4.0 with the Jigi design system tokens from Section 14 of the project specification. Key colors:
- Background: `#FEFDFB`
- Accent (teal): `#0D9488`
- Text primary: `#1C1917`

### UI Component Guidelines

Each component should:
- Be fully typed with TypeScript
- Support className prop for customization
- Use Tailwind classes (no inline styles)
- Include loading/disabled states where appropriate
- Be accessible (proper ARIA attributes)

**Button Component Example:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner className="mr-2 h-4 w-4" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
```

### Toast System Setup

Use a context-based toast system:
```typescript
// src/components/ui/Toast/ToastProvider.tsx
// src/hooks/useToast.ts

const { toast } = useToast()
toast.success('Asset approved!')
toast.error('Something went wrong')
```

### Project Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@supabase/supabase-js": "^2.50.0",
    "lucide-react": "^0.450.0",
    "zustand": "^5.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "typescript": "^5.8.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@types/react": "^19.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

---

## Acceptance Criteria

- [ ] Repository is public/private on GitHub with clean commit history
- [ ] `pnpm install` works without errors
- [ ] `pnpm dev` starts the development server
- [ ] **All UI components render correctly with variants**
- [ ] **Sidebar navigation works and highlights active route**
- [ ] **Modal, Toast, and Dropdown components functional**
- [ ] All routes render placeholder content
- [ ] `quick-start` route exists for idea-first workflow
- [ ] Tailwind styles are applied correctly
- [ ] Application is deployed to Vercel
- [ ] Vercel preview deployments work for PRs

---

## UI Components Checklist

| Component | Variants | States | Done |
|-----------|----------|--------|------|
| Button | primary, secondary, ghost, danger | loading, disabled | [ ] |
| Input | default | error, disabled | [ ] |
| Textarea | default | error, disabled | [ ] |
| Select | default | error, disabled | [ ] |
| Checkbox | default | checked, disabled | [ ] |
| Card | default, compact | hover (interactive) | [ ] |
| Badge | draft, pending, approved, rejected, etc. | — | [ ] |
| Avatar | image, initials | — | [ ] |
| Spinner | sm, md, lg | — | [ ] |
| Skeleton | text, card, avatar | — | [ ] |
| Modal | sm, md, lg | — | [ ] |
| Toast | success, error, info, warning | — | [ ] |
| Dropdown | default | — | [ ] |
| Tooltip | default | — | [ ] |
| EmptyState | default | with action | [ ] |
| PageHeader | default | with actions | [ ] |

---

## Dependencies for Next Sprint

Sprint 02 requires:
- Supabase project URL and keys
- Vercel deployment working
- React Router configured
- **Full UI component library available**
- **AppLayout with sidebar working**
- **Modal, Toast systems functional**

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Tailwind 4.0 breaking changes | Use stable API, reference official docs |
| Vercel deployment issues | Test early, check build logs |
| pnpm workspace complexity | Keep structure simple initially |

---

## Template Benefits This Sprint

| Template | Benefit | Time Saved |
|----------|---------|------------|
| **shadcn/ui** | 16+ accessible, customizable components | ~2 days |
| **Sonner** | Production-ready toast system | ~0.5 day |
| **Lucide React** | Consistent icon library | — |

**shadcn/ui Components Added This Sprint:**
```bash
# Day 3: Core UI
pnpm dlx shadcn@latest add button input textarea select checkbox card badge avatar skeleton

# Day 4: Layout & Patterns
pnpm dlx shadcn@latest add dialog dropdown-menu tooltip popover sonner form

# Additional components for future sprints (install now)
pnpm dlx shadcn@latest add tabs separator alert-dialog progress
```

**Why shadcn/ui:**
- Code is copied to your project (not imported from node_modules)
- Zero lock-in, full customization
- Accessible by default (WCAG compliant)
- Works perfectly with Tailwind CSS
- No runtime overhead (just your code)
- Active community, well-documented

---

*Sprint 01 of 10 — Foundation Phase*
