# Sprint 07 — Submission Workflow

**Duration:** Week 7 (5 days)  
**Phase:** Approval (1 of 3)  
**Goal:** Build the asset submission and review queue system

---

## Sprint Objectives

1. Implement asset status management system
2. Build "Submit for Review" functionality
3. **Build Review Queue page UI**
4. **Build Asset Review page UI (split layout: preview + details)**
5. Create the review queue interface
6. Build the asset review page
7. Preserve review clarity for both brand-grounded and idea-first assets

---

## UI Components to Build This Sprint

| Component | Description |
|-----------|-------------|
| `ReviewQueuePage` | Full page showing pending assets grouped by campaign |
| `ReviewQueueCard` | Campaign card showing pending asset count and previews |
| `AssetReviewPage` | Split-view page for reviewing single asset |
| `AssetPreviewArea` | Left side: displays concept/copy/image content |
| `AssetDetailsSidebar` | Right side: compliance, details, actions |
| `StatusBadge` | (Uses existing) Shows current asset status |
| `SubmitModal` | Modal for submitting asset with optional note |

---

## Deliverables

### Day 1: Asset Status Management

- [ ] Define complete status transition rules
- [ ] Create status update API endpoint
- [ ] Add status history tracking
- [ ] Implement status validation
- [ ] Update asset UI to show status

**Status Transitions:**
```typescript
const STATUS_TRANSITIONS = {
  draft: ['agency_review', 'submitted'],
  agency_review: ['draft', 'submitted'],
  submitted: ['brand_review'],
  brand_review: ['approved', 'rejected', 'changes_requested'],
  changes_requested: ['draft', 'submitted'],
  approved: [],  // Terminal state
  rejected: []   // Terminal state
}

function canTransition(from: AssetStatus, to: AssetStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}
```

**Status History Table:**
```sql
CREATE TABLE asset_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    from_status TEXT,
    to_status TEXT NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Day 2: Submit for Review API

- [ ] Create `/api/assets/:id/submit` endpoint
- [ ] Validate submission requirements
- [ ] Update asset status
- [ ] Record status history
- [ ] Trigger notification (placeholder)

**Endpoint: POST /api/assets/:id/submit**
```typescript
interface SubmitRequest {
  target: 'agency_review' | 'brand_review'
  message?: string  // Optional note with submission
}

export default async function handler(req, res) {
  const { id } = req.query
  const { target, message } = req.body
  
  const supabase = createClient(req)
  
  // Fetch current asset
  const { data: asset } = await supabase
    .from('creative_assets')
    .select('*, campaigns(brand_id)')
    .eq('id', id)
    .single()
  
  // Validate transition
  const newStatus = target === 'brand_review' ? 'submitted' : 'agency_review'
  if (!canTransition(asset.status, newStatus)) {
    return res.status(400).json({ 
      error: `Cannot submit from status: ${asset.status}` 
    })
  }
  
  // Update status
  const { data: updated } = await supabase
    .from('creative_assets')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single()
  
  // Record history
  await supabase.from('asset_status_history').insert({
    asset_id: id,
    user_id: req.user.id,
    from_status: asset.status,
    to_status: newStatus,
    notes: message
  })
  
  // TODO: Trigger notification (Sprint 08)
  
  return res.json({ asset: updated })
}
```

### Day 3: Review Queue Page

- [ ] Build Review Queue page component
- [ ] Fetch pending review assets
- [ ] Group by campaign
- [ ] Add filters (status, date, campaign)
- [ ] Show asset preview cards

**Review Queue UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Review Queue                                                   │
│                                                                 │
│  Filter: [ All Statuses ▼ ] [ All Campaigns ▼ ]                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Pending Your Review (5)                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Q3 Summer Collection                                     │   │
│  │                                                         │   │
│  │ ┌─────┐ ┌─────┐ ┌─────┐                                │   │
│  │ │ 📄  │ │ 📄  │ │ 🖼  │  3 assets awaiting review      │   │
│  │ │Copy │ │Copy │ │Image│  Submitted 2 hours ago          │   │
│  │ └─────┘ └─────┘ └─────┘                                │   │
│  │                                                         │   │
│  │                                    [ Start Review → ]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Product Launch Campaign                                  │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Recently Reviewed (10)                                         │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

**Review Queue Query:**
```typescript
// Fetch assets pending current user's review
const { data: pendingAssets } = await supabase
  .from('creative_assets')
  .select(`
    *,
    campaigns (
      id,
      name,
      brand_id,
      brands (name)
    )
  `)
  .in('status', ['submitted', 'brand_review'])
  .order('updated_at', { ascending: false })
```

### Day 4: Asset Review Page

- [ ] Build Asset Review page layout
- [ ] Display asset content (concept/copy/image)
- [ ] Show compliance check results
- [ ] Show asset generation context (`brand_grounded` vs `idea_first`)
- [ ] Add action buttons (Approve, Reject, Request Changes)
- [ ] Show submission context

**Asset Review Page Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Queue                                                │
│                                                                 │
│  Q3 Summer Collection / Asset Review                            │
│  Submitted by Jane Smith • 2 hours ago                          │
│                                                                 │
├─────────────────────────────────────────────────┬───────────────┤
│                                                 │               │
│                                                 │  Compliance   │
│                                                 │  ✓ Tone       │
│       [Asset Preview Area]                      │  ✓ Language   │
│                                                 │  ⚠ Legal      │
│       For images: Full image                    │               │
│       For copy: Formatted copy                  │  ───────────  │
│       For concepts: Concept card                │               │
│                                                 │  Details      │
│                                                 │  Type: Copy   │
│                                                 │  Version: 1   │
│                                                 │  Format: IG   │
│                                                 │  Context:     │
│                                                 │  Idea-First   │
│                                                 │               │
├─────────────────────────────────────────────────┴───────────────┤
│                                                                 │
│  Submission Note:                                               │
│  "Updated based on your feedback about the headline tone."      │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  [ Request Changes ]      [ Reject ]      [ ✓ Approve ]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Day 5: Review Navigation & Polish

- [ ] Add next/previous asset navigation
- [ ] Build batch review mode
- [ ] Add keyboard shortcuts
- [ ] Implement review session tracking
- [ ] Polish loading and empty states

**Keyboard Shortcuts:**
```typescript
const REVIEW_SHORTCUTS = {
  'a': 'Approve',
  'r': 'Request Changes',
  'x': 'Reject',
  'n': 'Next Asset',
  'p': 'Previous Asset',
  'Escape': 'Back to Queue'
}
```

**Batch Review Mode:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Batch Review (3 of 5)                     [ Exit Batch Mode ]  │
│                                                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                                │
│  │ ✓ │ │ ✓ │ │ ● │ │   │ │   │                                │
│  └───┘ └───┘ └───┘ └───┘ └───┘                                │
│   Done  Done Current Pending Pending                            │
│                                                                 │
│  [Previous]                                          [Next]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Permission Checks

```typescript
function canReview(user: User, asset: Asset, brand: Brand): boolean {
  // Brand users can review if they're approvers
  if (user.organisation_id === brand.organisation_id) {
    return ['admin', 'approver'].includes(user.role)
  }
  
  // Agency users can only do internal reviews
  // (agency_review status handled separately)
  return false
}
```

### Real-time Updates (Polling for MVP)

```typescript
// Poll for new submissions every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    refetchPendingAssets()
  }, 30000)
  
  return () => clearInterval(interval)
}, [])
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assets/:id/submit` | Submit for review |
| GET | `/api/review/queue` | Get pending review queue |
| GET | `/api/assets/:id/review` | Get asset with review context |
| GET | `/api/assets/:id/history` | Get status history |

---

## Acceptance Criteria

- [ ] Assets can be submitted from draft status
- [ ] Submission records history with timestamp
- [ ] Review queue shows pending assets
- [ ] Queue filters work correctly
- [ ] Asset review page displays all content
- [ ] Compliance results shown on review page
- [ ] Reviewers can clearly identify `idea_first` vs `brand_grounded` assets
- [ ] Navigation between assets works
- [ ] Keyboard shortcuts functional

---

## Test Scenarios

1. **Submit asset:** Draft → Submit → See in review queue
2. **Queue filtering:** Multiple campaigns → Filter by one → See only relevant
3. **Review navigation:** Enter batch mode → Next/Previous → See different assets
4. **Permission check:** Non-approver tries to review → Denied
5. **Status history:** Submit → Request Changes → Re-submit → View history
6. **Mixed queue:** Review queue contains both idea-first and brand-grounded assets with clear labels

---

## Dependencies for Next Sprint

Sprint 08 requires:
- Asset submission working
- Review queue functional
- Asset review page built
- Status management complete

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Queue gets long | Pagination, better filtering |
| Status race conditions | Use database transactions |
| Complex asset types | Consistent preview components |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **TanStack Query** | Review queue with automatic refetch, filters as query keys |
| **shadcn Badge** | Status badges with custom variants (Draft, Pending, Approved) |
| **shadcn Select** | Filter dropdowns for campaign/status filtering |
| **shadcn Separator** | Visual dividers in review sidebar |

**Review Queue with TanStack Query:**
```typescript
export function useReviewQueue(filters: ReviewFilters) {
  return useQuery({
    queryKey: ['review-queue', filters],
    queryFn: () => fetchReviewQueue(filters),
    staleTime: 10 * 1000, // 10 seconds (queue changes frequently)
  })
}

// Invalidate on status change
const submitMutation = useMutation({
  mutationFn: submitAsset,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['review-queue'] })
  },
})
```

---

*Sprint 07 of 10 — Approval Phase*
