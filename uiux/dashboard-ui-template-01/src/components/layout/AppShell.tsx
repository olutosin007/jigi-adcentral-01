import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
type Screen = 'dashboard' | 'campaign' | 'review';
interface AppShellProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  pageTitle: string;
  showCTAs?: boolean;
  onCreateCampaign?: () => void;
  onReviewQueue?: () => void;
  children: ReactNode;
}
export function AppShell({
  currentScreen,
  onNavigate,
  pageTitle,
  showCTAs,
  onCreateCampaign,
  onReviewQueue,
  children
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#FEFDFB]">
      <Sidebar currentScreen={currentScreen} onNavigate={onNavigate} />
      <Header
        title={pageTitle}
        showCTAs={showCTAs}
        onCreateCampaign={onCreateCampaign}
        onReviewQueue={onReviewQueue} />

      <main
        className="overflow-y-auto scrollbar-thin"
        style={{
          marginLeft: '240px',
          marginTop: '60px',
          minHeight: 'calc(100vh - 60px)'
        }}
        id="main-content"
        tabIndex={-1}>

        {children}
      </main>
    </div>);

}