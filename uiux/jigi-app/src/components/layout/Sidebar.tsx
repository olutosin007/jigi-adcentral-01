import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboardIcon,
  FolderOpenIcon,
  ClipboardListIcon,
  SettingsIcon,
  ChevronRightIcon,
  Building2Icon,
  SparklesIcon,
  CheckCircleIcon,
  PanelLeftCloseIcon,
  PanelLeftIcon,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useRecentCampaigns, useDashboardStats } from '@/hooks/useDashboardQueries'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Logo } from '@/components/Logo'
import { UserAvatar } from '@/components/layout/UserAvatar'

const RECENT_DOT_COLORS = ['bg-primary', 'bg-chart-2', 'bg-chart-3']

function getRoleLabel(role: string | undefined): string {
  switch (role) {
    case 'creator':
      return 'Agency Creator'
    case 'admin':
      return 'Admin'
    case 'approver':
      return 'Approver'
    case 'reviewer':
      return 'Reviewer'
    default:
      return 'Member'
  }
}

interface NavItem {
  label: string
  icon: ComponentType<{ className?: string }>
  href: string
  badge?: string | number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Create',
    items: [
      { label: 'Quick Start', icon: SparklesIcon, href: '/app/quick-start' },
      { label: 'Dashboard', icon: LayoutDashboardIcon, href: '/app/dashboard' },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Campaigns', icon: FolderOpenIcon, href: '/app/campaigns' },
      { label: 'Brands', icon: Building2Icon, href: '/app/brands' },
      { label: 'Approved Assets', icon: CheckCircleIcon, href: '/app/approved' },
    ],
  },
  {
    title: 'Review',
    items: [
      { label: 'Review Queue', icon: ClipboardListIcon, href: '/app/review' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', icon: SettingsIcon, href: '/app/settings' },
    ],
  },
]

interface SidebarContentProps {
  collapsed?: boolean
  onNavigate?: () => void
  onToggle?: () => void
}

function SidebarContent({ collapsed = false, onNavigate, onToggle }: SidebarContentProps) {
  const location = useLocation()
  const { user, profile } = useAuthStore()
  const { data: recentCampaignsData, isLoading: recentLoading } = useRecentCampaigns(5)
  const { data: dashboardStats } = useDashboardStats(user?.id ?? '')

  const displayName =
    profile?.name ?? user?.user_metadata?.full_name ?? (user?.email?.split('@')[0] || 'User')
  const roleLabel = getRoleLabel(profile?.role)

  const isActive = (href: string) => {
    if (href === '/app/dashboard') {
      return location.pathname === '/app/dashboard' || location.pathname === '/app'
    }
    return location.pathname.startsWith(href)
  }

  const navLinkClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group min-h-[44px] md:min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
    }`

  const NavLink = ({
    item,
    active,
    Icon,
    badgeCount,
    showBadge,
  }: {
    item: NavItem
    active: boolean
    Icon: ComponentType<{ className?: string }>
    badgeCount: number
    showBadge: boolean
  }) => {
    const content = (
      <Link
        to={item.href}
        onClick={onNavigate}
        className={navLinkClass(active)}
        aria-current={active ? 'page' : undefined}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
          }`}
        />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {showBadge && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              active ? 'bg-white/20 text-white' : 'bg-warning/10 text-warning'
            }`}
          >
            {badgeCount}
          </span>
        )}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }
    return content
  }

  return (
    <>
      {/* Logo + Toggle */}
      <div
        className={`flex items-center h-[60px] border-b border-border dark:border-sidebar-border flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'px-2 justify-between' : 'px-3 justify-between'
        }`}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 flex-1 min-w-0 ${collapsed ? 'justify-center' : ''}`}
        >
          <Logo size="md" showText={!collapsed} asLink={false} />
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-sidebar-accent transition-all duration-200 flex-shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftIcon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <PanelLeftCloseIcon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        <TooltipProvider delayDuration={0}>
          {navSections.map((section, sectionIdx) => (
            <div
              key={section.title}
              className={sectionIdx > 0 ? 'mt-4 pt-4 border-t border-border dark:border-sidebar-border' : ''}
            >
              {!collapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  const rawBadge =
                    item.label === 'Review Queue'
                      ? (dashboardStats?.pendingReview ?? 0)
                      : (item.badge ?? 0)
                  const badgeCount = typeof rawBadge === 'number' ? rawBadge : Number(rawBadge) || 0
                  const showBadge = badgeCount > 0
                  return (
                    <NavLink
                      key={item.label}
                      item={item}
                      active={active}
                      Icon={Icon}
                      badgeCount={badgeCount}
                      showBadge={showBadge}
                    />
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t border-border dark:border-sidebar-border">
            {!collapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                Recent
              </p>
            )}
            <div className="space-y-0.5">
              {recentLoading ? (
                <p className={`px-3 py-2 text-xs text-muted-foreground ${collapsed ? 'text-center' : ''}`}>
                  Loading…
                </p>
              ) : !recentCampaignsData?.length ? (
                <p className={`px-3 py-2 text-xs text-muted-foreground ${collapsed ? 'text-center' : ''}`}>
                  No recent
                </p>
              ) : (
                recentCampaignsData.map((campaign, index) => {
                  const link = (
                    <Link
                      key={campaign.id}
                      to={`/app/campaigns/${campaign.id}`}
                      onClick={onNavigate}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors duration-200 group min-h-[44px] md:min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
                        collapsed ? 'justify-center' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${RECENT_DOT_COLORS[index % RECENT_DOT_COLORS.length]} flex-shrink-0`}
                      />
                      {!collapsed && (
                        <span className="flex-1 text-left truncate">{campaign.name}</span>
                      )}
                      {!collapsed && (
                        <ChevronRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  )
                  if (collapsed) {
                    return (
                      <Tooltip key={campaign.id}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {campaign.name}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }
                  return link
                })
              )}
            </div>
          </div>
        </TooltipProvider>
      </nav>

      {/* User Profile */}
      <div
        className={`px-3 py-4 border-t border-border dark:border-sidebar-border flex-shrink-0 transition-all duration-200 ${
          collapsed ? 'flex justify-center' : ''
        }`}
      >
        <Link
          to="/app/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted dark:hover:bg-sidebar-accent transition-colors duration-200 cursor-pointer group min-h-[44px] md:min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none ${
            collapsed ? 'justify-center' : ''
          }`}
          aria-label="Profile and settings"
        >
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            displayName={displayName}
            email={user?.email}
            size="md"
            className="h-8 w-8"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground dark:text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {roleLabel}
              </p>
            </div>
          )}
          {!collapsed && (
            <div
              className="w-1.5 h-1.5 rounded-full bg-success flex-shrink-0"
              title="Online"
            />
          )}
        </Link>
      </div>
    </>
  )
}

interface SidebarProps {
  isMobile?: boolean
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function Sidebar({ isMobile = false, mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  const handleNavigate = () => {
    if (isMobile && onMobileOpenChange) {
      onMobileOpenChange(false)
    }
  }

  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-[280px] max-w-[85vw] p-0 gap-0 flex flex-col"
        >
          <div className="flex flex-col h-full bg-background dark:bg-sidebar">
            <SidebarContent collapsed={false} onNavigate={handleNavigate} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const sidebarWidth = sidebarCollapsed ? 64 : 240

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col bg-background dark:bg-sidebar border-r border-border dark:border-sidebar-border z-20 transition-all duration-200 ease-linear"
      style={{ width: sidebarWidth }}
      aria-label="Main navigation"
    >
      <SidebarContent collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
    </aside>
  )
}
