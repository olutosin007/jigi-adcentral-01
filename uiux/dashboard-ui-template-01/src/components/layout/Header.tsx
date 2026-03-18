import React from 'react';
import {
  BellIcon,
  SearchIcon,
  PlusIcon,
  ClipboardCheckIcon } from
'lucide-react';
interface HeaderProps {
  title: string;
  onCreateCampaign?: () => void;
  onReviewQueue?: () => void;
  showCTAs?: boolean;
}
export function Header({
  title,
  onCreateCampaign,
  onReviewQueue,
  showCTAs = false
}: HeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 h-[60px] bg-white border-b border-[#E8E5DF] flex items-center px-6 z-10 gap-4"
      style={{
        left: '240px'
      }}
      role="banner">

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-[#1C1917]">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <SearchIcon className="absolute left-3 w-3.5 h-3.5 text-[#78716C]" />
        <input
          type="search"
          placeholder="Search assets, campaigns..."
          className="pl-9 pr-4 py-1.5 text-sm bg-[#F5F4F0] border border-transparent rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] focus:bg-white transition-all placeholder:text-[#78716C]"
          aria-label="Search" />

      </div>

      {/* CTAs */}
      {showCTAs &&
      <div className="flex items-center gap-2">
          <button
          onClick={onReviewQueue}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-[#1C1917] bg-[#F5F4F0] border border-[#E8E5DF] rounded-lg hover:bg-[#E8E5DF] transition-colors">

            <ClipboardCheckIcon className="w-3.5 h-3.5" />
            Review Queue
          </button>
          <button
          onClick={onCreateCampaign}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-white bg-[#0D9488] rounded-lg hover:bg-[#0F766E] transition-colors shadow-sm">

            <PlusIcon className="w-3.5 h-3.5" />
            Create Campaign
          </button>
        </div>
      }

      {/* Notifications */}
      <button
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F4F0] transition-colors"
        aria-label="Notifications (3 unread)">

        <BellIcon
          className="w-4.5 h-4.5 text-[#78716C]"
          style={{
            width: '18px',
            height: '18px'
          }} />

        <span
          className="absolute top-1 right-1 w-2 h-2 bg-[#0D9488] rounded-full border-2 border-white"
          aria-hidden="true" />

      </button>

      {/* User Avatar */}
      <div
        className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center cursor-pointer flex-shrink-0"
        aria-label="User menu">

        <span className="text-white text-xs font-semibold">SC</span>
      </div>
    </header>);

}