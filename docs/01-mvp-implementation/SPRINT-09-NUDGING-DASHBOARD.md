# Sprint 09 — Nudging System & Dashboard

**Duration:** Week 9 (5 days)  
**Phase:** Approval (3 of 3)  
**Goal:** Implement proactive nudging and build the main dashboard

---

## Sprint Objectives

1. Build the 24-hour nudge reminder system
2. **Build Dashboard page with widget layout**
3. **Build Quick Stats widget**
4. **Build Pending Reviews widget**
5. **Build Recent Campaigns widget**
6. **Build Approved Assets page**
7. Create the main dashboard with widgets
8. Build the approved assets view
9. Polish the complete user experience
10. Surface adoption of idea-first vs brand-grounded generation in dashboard insights

---

## UI Components to Build This Sprint

| Component | Description |
|-----------|-------------|
| `DashboardPage` | Main dashboard with grid layout for widgets |
| `QuickStatsWidget` | Shows pending/active/approved counts |
| `StatCard` | Individual stat with number and label |
| `PendingReviewsWidget` | List of campaigns with pending assets |
| `RecentCampaignsWidget` | List of recently updated campaigns |
| `ApprovedAssetsPage` | Full page grid of approved assets |
| `ApprovedAssetCard` | Asset thumbnail with download action |
| `AssetDetailModal` | Modal showing full asset with metadata |
| `DownloadButton` | Button that triggers asset download |

---

## Deliverables

### Day 1: Nudge System Design

- [ ] Design nudge logic and timing
- [ ] Create nudge tracking table
- [ ] Build nudge check function
- [ ] Set up scheduled job (Vercel Cron)
- [ ] Test nudge triggering

**Nudge Rules (MVP):**
```typescript
const NUDGE_RULES = [
  {
    trigger: 'pending_24h',
    condition: 'Asset pending review for 24+ hours',
    timing: 'Daily at 9 AM',
    action: 'Email + in-app notification to reviewer'
  },
  {
    trigger: 'pending_48h',
    condition: 'Asset pending review for 48+ hours',
    timing: 'Daily at 9 AM',
    action: 'Email to reviewer + escalate to backup (if configured)'
  }
]
```

**Nudge Tracking Table:**
```sql
CREATE TABLE nudge_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    nudge_type TEXT NOT NULL,
    -- Types: pending_24h, pending_48h, opened_no_action
    
    email_sent BOOLEAN DEFAULT FALSE,
    notification_created BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Day 2: Vercel Cron Job

- [ ] Create `/api/cron/nudge` endpoint
- [ ] Implement nudge check logic
- [ ] Send nudge emails
- [ ] Create nudge notifications
- [ ] Configure Vercel Cron schedule

**Vercel Cron Configuration:**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/nudge",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Nudge Cron Endpoint:**
```typescript
// packages/api/cron/nudge.ts

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const supabase = createAdminClient()
  
  // Find assets pending > 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const { data: pendingAssets } = await supabase
    .from('creative_assets')
    .select(`
      *,
      campaigns (
        brand_id,
        brands (
          organisation_id,
          governance
        )
      )
    `)
    .eq('status', 'brand_review')
    .lt('updated_at', twentyFourHoursAgo.toISOString())
  
  // Get reviewers for each asset's brand
  for (const asset of pendingAssets) {
    const { data: reviewers } = await supabase
      .from('users')
      .select('*')
      .eq('organisation_id', asset.campaigns.brands.organisation_id)
      .in('role', ['admin', 'approver'])
    
    // Check if already nudged today
    const { data: existingNudge } = await supabase
      .from('nudge_log')
      .select('*')
      .eq('asset_id', asset.id)
      .gte('created_at', new Date().toISOString().split('T')[0])
    
    if (existingNudge?.length > 0) continue
    
    // Send nudges
    for (const reviewer of reviewers) {
      await sendNudgeEmail(reviewer, asset)
      
      await createNotification(supabase, {
        userId: reviewer.id,
        type: 'nudge_reminder',
        title: 'Review reminder',
        body: `"${asset.campaigns.name}" has assets waiting for your review`,
        relatedAssetId: asset.id,
        sendEmail: false  // Already sent dedicated nudge email
      })
      
      // Log nudge
      await supabase.from('nudge_log').insert({
        asset_id: asset.id,
        user_id: reviewer.id,
        nudge_type: 'pending_24h',
        email_sent: true,
        notification_created: true
      })
    }
  }
  
  return res.json({ 
    processed: pendingAssets?.length ?? 0 
  })
}
```

**Nudge Email Template:**
```typescript
export function nudgeEmail(data: {
  recipientName: string
  campaignName: string
  assetCount: number
  pendingHours: number
  reviewUrl: string
}): string {
  return `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D97706;">Friendly reminder</h2>
      
      <p>Hi ${data.recipientName},</p>
      
      <p>You have ${data.assetCount} ${data.assetCount === 1 ? 'asset' : 'assets'} 
         waiting for review in "${data.campaignName}". 
         ${data.assetCount === 1 ? "It's" : "They've"} been pending 
         for ${data.pendingHours} hours.</p>
      
      <p>Quick reviews help your agency deliver faster!</p>
      
      <a href="${data.reviewUrl}" 
         style="display: inline-block; background: #0D9488; color: white; 
                padding: 12px 24px; border-radius: 8px; text-decoration: none;
                margin: 16px 0;">
        Review Now
      </a>
      
      <p style="color: #78716C; font-size: 14px;">
        — The Jigi Team
      </p>
    </div>
  `
}
```

### Day 3: Main Dashboard

- [ ] Build Dashboard page layout
- [ ] Create "Pending Reviews" widget
- [ ] Create "Recent Campaigns" widget
- [ ] Create "Quick Stats" widget
- [ ] Add quick action buttons
- [ ] Add "Generation Mix" stat (Idea-First vs Brand-Grounded)

**Dashboard Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Good morning, Jane                                    [ ? Help]│
│                                                                 │
├────────────────────────────────────┬────────────────────────────┤
│  Quick Stats                       │  Pending Your Review       │
│                                    │                            │
│  ┌───────┐ ┌───────┐ ┌───────┐    │  ┌──────────────────────┐  │
│  │   5   │ │   3   │ │  12   │    │  │ Q3 Campaign          │  │
│  │Pending│ │Active │ │Aprvd  │    │  │ 3 assets • 2h ago    │  │
│  │Review │ │Campgns│ │ Week  │    │  │         [Review →]   │  │
│  └───────┘ └───────┘ └───────┘    │  └──────────────────────┘  │
│                                    │                            │
│  [ + New Campaign ]                │  ┌──────────────────────┐  │
│                                    │  │ Product Launch       │  │
├────────────────────────────────────┤  │ 2 assets • 1d ago    │  │
│  Recent Campaigns                  │  │         [Review →]   │  │
│                                    │  └──────────────────────┘  │
│  ┌──────────────────────────────┐ │                            │
│  │ Q3 Summer Collection         │ │  View all →                │
│  │ 8 assets • 3 approved        │ │                            │
│  │ Last updated 2 hours ago     │ │                            │
│  └──────────────────────────────┘ │                            │
│                                    │                            │
│  ┌──────────────────────────────┐ │                            │
│  │ Product Launch 2026          │ │                            │
│  │ 12 assets • 7 approved       │ │                            │
│  │ Last updated 1 day ago       │ │                            │
│  └──────────────────────────────┘ │                            │
│                                    │                            │
│  View all campaigns →              │                            │
└────────────────────────────────────┴────────────────────────────┘
```

**Dashboard Data Fetching:**
```typescript
// Fetch dashboard data in parallel
const [
  { data: pendingReviews },
  { data: recentCampaigns },
  { data: weeklyStats }
] = await Promise.all([
  supabase
    .from('creative_assets')
    .select('*, campaigns(*)')
    .in('status', ['submitted', 'brand_review'])
    .order('updated_at', { ascending: false })
    .limit(5),
    
  supabase
    .from('campaigns')
    .select('*, creative_assets(status)')
    .order('updated_at', { ascending: false })
    .limit(5),
    
  supabase
    .from('creative_assets')
    .select('status')
    .gte('updated_at', weekAgo.toISOString())
])
```

### Day 4: Approved Assets View

- [ ] Build Approved Assets page
- [ ] Group by campaign
- [ ] Show version history
- [ ] Add download functionality
- [ ] Implement basic search

**Approved Assets Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Approved Assets                                                │
│                                                                 │
│  Search: [                                    ] [ Filter ▼ ]    │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Q3 Summer Collection (7 assets)                                │
│                                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 🖼  │ │ 🖼  │ │ 📄  │ │ 📄  │ │ 📄  │ │ 💡  │ │ 💡  │      │
│  │     │ │     │ │Copy │ │Copy │ │Copy │ │Conc │ │Conc │      │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Product Launch 2026 (5 assets)                                 │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Asset Detail Modal (from Approved Assets):**
```
┌─────────────────────────────────────────────────────────────────┐
│  Approved Asset                                           [ X ] │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    [Asset Preview]                        │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Type: Image                                                    │
│  Approved: Feb 25, 2026 by Jane Smith                          │
│  Version: 2 (see history)                                       │
│                                                                 │
│  [ Download Original ]  [ Copy to Clipboard ]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Day 5: Polish & Edge Cases

- [ ] Handle empty states across all views
- [ ] Add loading skeletons
- [ ] Implement error boundaries
- [ ] Polish mobile responsiveness
- [ ] Add keyboard navigation
- [ ] Test all user flows end-to-end

**Empty States:**
```typescript
const EMPTY_STATES = {
  dashboard_pending: {
    icon: '✓',
    title: "You're all caught up!",
    description: "No assets waiting for your review."
  },
  campaigns: {
    icon: '📋',
    title: "No campaigns yet",
    description: "Create your first campaign to start generating creative.",
    action: { label: "New Campaign", href: "/campaigns/new" }
  },
  approved_assets: {
    icon: '📁',
    title: "No approved assets yet",
    description: "Assets will appear here once they're approved."
  },
  review_queue: {
    icon: '✓',
    title: "Review queue is empty",
    description: "No assets pending your review right now."
  }
}
```

**Loading Skeletons:**
```typescript
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  )
}
```

---

## Technical Notes

### Vercel Cron Limits

- Free tier: 2 cron jobs, daily only
- Pro tier: Unlimited jobs, minute-level precision
- For MVP, daily 9 AM nudge is sufficient

### Dashboard Performance

- Fetch all widgets in parallel
- Use SWR/React Query for caching
- Show skeleton while loading
- Lazy load heavy widgets

### Mobile Responsiveness

Key breakpoints:
- Desktop: 2-column dashboard
- Tablet: Single column, cards stack
- Mobile: Simplified widgets, bottom nav

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/dashboard/stats` | Get stats widget data |
| GET | `/api/assets/approved` | Get approved assets |
| GET | `/api/cron/nudge` | Cron job for nudging |

---

## Acceptance Criteria

- [ ] Nudge emails sent for 24h+ pending assets
- [ ] Nudge runs daily at 9 AM
- [ ] Nudge log prevents duplicate sends
- [ ] Dashboard shows pending reviews
- [ ] Dashboard shows recent campaigns
- [ ] Dashboard shows weekly stats
- [ ] Dashboard can distinguish idea-first and brand-grounded activity
- [ ] Approved assets view works
- [ ] Empty states display correctly
- [ ] Loading states are smooth
- [ ] Mobile layout is usable

---

## Test Scenarios

1. **Nudge flow:** Submit asset → Wait 24h (simulated) → Receive nudge email
2. **Dashboard data:** Create campaign → Generate assets → See in dashboard
3. **Approved assets:** Approve asset → Find in approved library → Download
4. **Empty states:** New user → See appropriate empty states with CTAs
5. **Mobile:** Test all key flows on mobile viewport
6. **Generation mix:** Run both journeys → Dashboard reflects both modes correctly

---

## Dependencies for Next Sprint

Sprint 10 requires:
- All features functional
- Dashboard working
- Nudging operational
- Approved assets accessible

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Cron job failures | Add logging, monitor Vercel dashboard |
| Dashboard slow | Optimize queries, add caching |
| Nudge fatigue | Respect user preferences (future) |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **TanStack Query** | Dashboard data caching, stale-while-revalidate pattern |
| **react-email** | Nudge email template (reuse notification email patterns) |
| **shadcn Card** | Dashboard stat cards, campaign cards |
| **shadcn Skeleton** | Dashboard loading states |

**Dashboard Queries with TanStack Query:**
```typescript
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000, // 1 minute (stats don't change rapidly)
  })
}

export function usePendingReviews() {
  return useQuery({
    queryKey: ['pending-reviews'],
    queryFn: fetchPendingReviews,
    refetchInterval: 60 * 1000, // Poll every minute
  })
}

export function useRecentCampaigns(limit = 5) {
  return useQuery({
    queryKey: ['recent-campaigns', limit],
    queryFn: () => fetchRecentCampaigns(limit),
    staleTime: 30 * 1000,
  })
}

// Dashboard component
function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: pending, isLoading: pendingLoading } = usePendingReviews()
  const { data: campaigns, isLoading: campaignsLoading } = useRecentCampaigns()
  
  return (
    <div className="grid gap-6">
      <QuickStatsWidget stats={stats} isLoading={statsLoading} />
      <PendingReviewsWidget reviews={pending} isLoading={pendingLoading} />
      <RecentCampaignsWidget campaigns={campaigns} isLoading={campaignsLoading} />
    </div>
  )
}
```

---

*Sprint 09 of 10 — Approval Phase*
