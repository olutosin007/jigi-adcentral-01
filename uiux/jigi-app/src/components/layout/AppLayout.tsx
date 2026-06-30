import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAppStore } from '@/store'
import { useIsMobile } from '@/hooks/use-mobile'

const pageTitles: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/quick-start': 'Quick Start',
  '/app/campaigns': 'Campaigns',
  '/app/brands': 'Brands',
  '/app/approved': 'Approved Assets',
  '/app/review': 'Review Queue',
  '/app/settings': 'Settings',
}

export function AppLayout() {
  const location = useLocation()
  const isMobile = useIsMobile()
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  const isCampaignDetail = /^\/app\/campaigns\/[^/]+$/.test(location.pathname)

  const getPageTitle = () => {
    if (isCampaignDetail) {
      return ''
    }
    if (location.pathname.startsWith('/app/review/')) {
      return 'Asset Review'
    }
    return pageTitles[location.pathname] || 'Dashboard'
  }

  const showCTAs = location.pathname === '/app/dashboard'

  const mainMarginLeft = isMobile ? 0 : sidebarCollapsed ? 64 : 240

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">
      <Sidebar
        isMobile={isMobile}
        mobileOpen={sidebarOpen}
        onMobileOpenChange={setSidebarOpen}
      />
      <Header
        title={getPageTitle()}
        hideTitle={isCampaignDetail}
        showCTAs={showCTAs}
        isMobile={isMobile}
        onMenuClick={() => setSidebarOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main
        className="min-w-0 overflow-x-hidden overflow-y-auto scrollbar-thin transition-[margin-left] duration-200 ease-linear"
        style={{
          marginLeft: mainMarginLeft,
          marginTop: '60px',
          minHeight: 'calc(100vh - 60px)',
        }}
        id="main-content"
        tabIndex={-1}
      >
        <Outlet />
      </main>
    </div>
  )
}
