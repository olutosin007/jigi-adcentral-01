import { useNavigate } from 'react-router-dom'
import {
  SearchIcon,
  PlusIcon,
  ClipboardCheckIcon,
  MenuIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { NotificationBell } from '@/components/notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title: string
  showCTAs?: boolean
  isMobile?: boolean
  onMenuClick?: () => void
  sidebarCollapsed?: boolean
}

export function Header({
  title,
  showCTAs = false,
  isMobile = false,
  onMenuClick,
  sidebarCollapsed = false,
}: HeaderProps) {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()

  const displayName =
    profile?.name ?? user?.user_metadata?.full_name ?? (user?.email?.split('@')[0] || 'User')

  const headerLeft = isMobile ? 0 : sidebarCollapsed ? 64 : 240

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header
      className="fixed top-0 right-0 h-[60px] bg-background border-b border-border flex items-center px-4 md:px-6 z-10 gap-4 transition-all duration-200 ease-linear"
      style={{ left: headerLeft }}
      role="banner"
    >
      {isMobile && onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5 text-foreground" />
        </button>
      )}
      {/* Page Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <SearchIcon className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Search assets, campaigns..."
          className="pl-9 pr-10 py-1.5 text-sm bg-muted border border-transparent rounded-lg w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary focus-visible:bg-background transition-all duration-200 placeholder:text-muted-foreground motion-reduce:transition-none"
          aria-label="Search"
        />
        <kbd className="absolute right-3 hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* CTAs */}
      {showCTAs && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/app/review')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-foreground bg-muted border border-border rounded-lg hover:bg-accent hover:border-accent transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ClipboardCheckIcon className="w-3.5 h-3.5" />
            Review Queue
          </button>
          <button
            onClick={() => navigate('/app/campaigns/new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-200 active:scale-[0.98] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Create Campaign
          </button>
        </div>
      )}

      {/* Notifications */}
      {user?.id ? (
        <NotificationBell userId={user.id} />
      ) : (
        <div className="w-9 h-9" />
      )}

      {/* User Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="rounded-full flex-shrink-0 hover:ring-2 hover:ring-ring hover:ring-offset-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="User menu"
          >
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              displayName={displayName}
              email={user?.email}
              size="md"
              className="h-8 w-8"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate('/app/settings')}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/app/settings')}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} variant="destructive">
            <LogOutIcon className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
