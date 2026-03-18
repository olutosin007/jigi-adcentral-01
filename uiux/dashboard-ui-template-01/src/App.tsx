import React, { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { CampaignDetail } from './pages/CampaignDetail';
import { AssetReview } from './pages/AssetReview';
type Screen = 'dashboard' | 'campaign' | 'review';
const screenTitles: Record<Screen, string> = {
  dashboard: 'Dashboard',
  campaign: 'Nike Summer 2024 Campaign',
  review: 'Asset Review'
};
export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const navigate = (screen: Screen) => setCurrentScreen(screen);
  return (
    <AppShell
      currentScreen={currentScreen}
      onNavigate={navigate}
      pageTitle={screenTitles[currentScreen]}
      showCTAs={currentScreen === 'dashboard'}
      onCreateCampaign={() => navigate('campaign')}
      onReviewQueue={() => navigate('review')}>

      {currentScreen === 'dashboard' &&
      <Dashboard
        onNavigateToCampaign={() => navigate('campaign')}
        onNavigateToReview={() => navigate('review')} />

      }
      {currentScreen === 'campaign' &&
      <CampaignDetail
        onBack={() => navigate('dashboard')}
        onNavigateToReview={() => navigate('review')} />

      }
      {currentScreen === 'review' &&
      <AssetReview onBack={() => navigate('campaign')} />
      }
    </AppShell>);

}