import React, { Component } from 'react';
import {
  LayoutDashboardIcon,
  FolderOpenIcon,
  ImageIcon,
  ClipboardListIcon,
  SettingsIcon,
  ChevronRightIcon } from
'lucide-react';
type Screen = 'dashboard' | 'campaign' | 'review';
interface SidebarProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}
interface NavItem {
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
  screen: Screen | null;
  href?: string;
}
const navItems: NavItem[] = [
{
  label: 'Dashboard',
  icon: LayoutDashboardIcon,
  screen: 'dashboard'
},
{
  label: 'Campaigns',
  icon: FolderOpenIcon,
  screen: 'campaign'
},
{
  label: 'Assets',
  icon: ImageIcon,
  screen: null
},
{
  label: 'Review Queue',
  icon: ClipboardListIcon,
  screen: 'review'
},
{
  label: 'Settings',
  icon: SettingsIcon,
  screen: null
}];

export function Sidebar({ currentScreen, onNavigate }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col bg-white border-r border-[#E8E5DF] z-20"
      style={{
        width: '240px'
      }}
      aria-label="Main navigation">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-[60px] border-b border-[#E8E5DF] flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center flex-shrink-0">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">

            <path
              d="M9 2L15.5 5.75V12.25L9 16L2.5 12.25V5.75L9 2Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round" />

            <path d="M9 6.5L11.5 8V11L9 12.5L6.5 11V8L9 6.5Z" fill="white" />
          </svg>
        </div>
        <span className="text-[#1C1917] font-bold text-lg tracking-tight">
          Jigi
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="text-[10px] font-semibold text-[#78716C] uppercase tracking-widest px-3 mb-2">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive = item.screen !== null && currentScreen === item.screen;
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => item.screen && onNavigate(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive ? 'bg-[#0D9488] text-white shadow-sm' : 'text-[#78716C] hover:bg-[#F0FDFA] hover:text-[#0D9488]'}`}
              aria-current={isActive ? 'page' : undefined}>

              <Icon
                className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#78716C] group-hover:text-[#0D9488]'}`} />

              <span className="flex-1 text-left">{item.label}</span>
              {item.label === 'Review Queue' &&
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>

                  12
                </span>
              }
            </button>);

        })}

        <div className="pt-4 mt-4 border-t border-[#E8E5DF]">
          <p className="text-[10px] font-semibold text-[#78716C] uppercase tracking-widest px-3 mb-2">
            Recent
          </p>
          <button
            onClick={() => onNavigate('campaign')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#78716C] hover:bg-[#F0FDFA] hover:text-[#0D9488] transition-all duration-150 group">

            <div className="w-2 h-2 rounded-full bg-[#0D9488] flex-shrink-0" />
            <span className="flex-1 text-left truncate">Nike Summer 2024</span>
            <ChevronRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button
            onClick={() => onNavigate('campaign')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#78716C] hover:bg-[#F0FDFA] hover:text-[#0D9488] transition-all duration-150 group">

            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
            <span className="flex-1 text-left truncate">Spotify Wrapped</span>
            <ChevronRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-[#E8E5DF] flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F5F4F0] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">SC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1C1917] truncate">
              Sarah Chen
            </p>
            <p className="text-[11px] text-[#78716C] truncate">
              Agency Creator
            </p>
          </div>
          <div
            className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"
            title="Online" />

        </div>
      </div>
    </aside>);

}