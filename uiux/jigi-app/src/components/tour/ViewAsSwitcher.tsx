import { useNavigate } from 'react-router-dom'
import { EyeIcon, CheckIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDemoStore } from '@/store/demoStore'
import { useEffectiveRole } from '@/hooks/useEffectiveRole'
import type { UserRole } from '@/lib/roles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PERSONA_LABEL: Record<'creator' | 'approver', string> = {
  creator: 'Agency Creative',
  approver: 'Brand Approver',
}

const PERSONA_HOME: Record<'creator' | 'approver', string> = {
  creator: '/app/dashboard',
  approver: '/app/review',
}

/**
 * Demo "view as" toggle — lets one session preview both persona flows and
 * carries the `role-switch` tour anchor. Presentation only; RLS still governs
 * data access (see demoStore).
 */
export function ViewAsSwitcher() {
  const navigate = useNavigate()
  const realRole = useAuthStore((s) => s.profile?.role)
  const viewAsRole = useDemoStore((s) => s.viewAsRole)
  const setViewAsRole = useDemoStore((s) => s.setViewAsRole)
  const effectiveRole = useEffectiveRole()

  const isActive = viewAsRole != null && viewAsRole !== realRole
  const activePersona = effectiveRole === 'creator' || effectiveRole === 'approver'
    ? PERSONA_LABEL[effectiveRole]
    : 'Your role'

  const selectPersona = (role: 'creator' | 'approver') => {
    setViewAsRole(role)
    navigate(PERSONA_HOME[role])
  }

  const resetToReal = () => {
    setViewAsRole(null)
    navigate('/app/dashboard')
  }

  const isSelected = (role: UserRole | null) =>
    role === null ? viewAsRole === null : viewAsRole === role

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-tour="role-switch"
          aria-label="Preview as persona"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isActive
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-muted border-border text-muted-foreground hover:bg-accent'
          }`}
        >
          <EyeIcon className="w-3.5 h-3.5" />
          <span className="max-w-[9rem] truncate">{isActive ? `Viewing: ${activePersona}` : 'View as'}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Preview a persona (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => selectPersona('creator')}>
          <span className="flex-1">{PERSONA_LABEL.creator}</span>
          {isSelected('creator') && <CheckIcon className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => selectPersona('approver')}>
          <span className="flex-1">{PERSONA_LABEL.approver}</span>
          {isSelected('approver') && <CheckIcon className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={resetToReal}>
          <span className="flex-1">Back to your role</span>
          {isSelected(null) && <CheckIcon className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
