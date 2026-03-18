# Sprint 05 — Creative Generation

**Duration:** Week 5 (5 days)  
**Phase:** Generation (2 of 3)  
**Goal:** Build concept and copy generation features with full UI integration

---

## Sprint Objectives

1. Implement concept generation endpoint and UI
2. Implement copy generation endpoint and UI
3. **Build Generation Panel UI components**
4. **Build Concept Card and Copy Card components**
5. **Build Asset Grid component**
6. Build asset saving and management
7. Create generation workflow in campaign detail
8. Support generation in two modes: brand-grounded and idea-first fallback

---

## UI Components to Build This Sprint

| Component | Description |
|-----------|-------------|
| `GenerationPanel` | Tab-based panel for triggering generation (Concepts/Copy/Images) |
| `ConceptCard` | Displays generated concept with theme, headlines, visual direction |
| `CopyCard` | Displays copy variant with headline, body, CTA |
| `AssetGrid` | Grid layout for displaying all campaign assets |
| `AssetCard` | Individual asset preview with status badge and actions |
| `GenerationLoadingState` | Skeleton cards shown during generation |

---

## Deliverables

### Day 1: Concept Generation API

- [ ] Create `/api/generate/concepts` endpoint
- [ ] Implement concept prompt building with brand injection
- [ ] Implement fallback prompt path when brand assets are unavailable
- [ ] Parse JSON response from GPT-4o-mini
- [ ] Save generated concepts as assets
- [ ] Add error handling and validation

**Endpoint: POST /api/generate/concepts**

```typescript
// packages/api/generate/concepts.ts

import { AIOrchestrator } from '../lib/ai/orchestrator'
import { createClient } from '../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { brand_id, campaign_id, brief, seed_idea } = req.body

  // Validate request
  if (!campaign_id || !brief) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const supabase = createClient(req)
  
  // Fetch brand constraints if provided
  let brand = null
  if (brand_id) {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brand_id)
      .single()
    brand = data
  }

  // Generate concepts
  const orchestrator = new AIOrchestrator()
  const result = await orchestrator.generate({
    type: 'concept',
    brand: brand
      ? {
          name: brand.name,
          identity: brand.identity,
          voice: brand.voice,
          strategy: brand.strategy
        }
      : undefined,
    fallback_context: !brand
      ? {
          seed_idea,
          audience: brief.audience,
          style_hints: brief.requirements ? [brief.requirements] : []
        }
      : undefined,
    brief
  })

  // Save concepts as assets
  const assets = await Promise.all(
    result.concepts.map(concept =>
      supabase
        .from('creative_assets')
        .insert({
          campaign_id,
          created_by: req.user.id,
          type: 'concept',
          generation_mode: brand ? 'brand_grounded' : 'idea_first',
          content: concept,
          status: 'draft'
        })
        .select()
        .single()
    )
  )

  return res.json({
    concepts: result.concepts,
    assets: assets.map(a => a.data),
    generation_id: result.generation_id
  })
}
```

### Day 2: Copy Generation API

- [ ] Create `/api/generate/copy` endpoint
- [ ] Implement copy prompt building
- [ ] Add format-specific prompts (social, display, etc.)
- [ ] Save generated copy as assets
- [ ] Support variant generation from existing copy

**Endpoint: POST /api/generate/copy**

```typescript
// Request body
interface CopyGenerationRequest {
  brand_id?: string
  campaign_id: string
  brief: CampaignBrief
  seed_idea?: string
  format: 'instagram_post' | 'facebook_ad' | 'display_ad' | 'email_header'
  concept_id?: string  // Optional: generate copy for specific concept
}

// Response
interface CopyGenerationResponse {
  variants: CopyVariant[]
  assets: Asset[]
  generation_id: string
}

interface CopyVariant {
  headline: string
  body: string
  cta: string
}
```

### Day 3: Generation UI Components

- [ ] Build `GenerationPanel` component for campaign detail
- [ ] Create `ConceptCard` component to display concepts
- [ ] Create `CopyCard` component to display copy variants
- [ ] Add loading states with skeleton loaders
- [ ] Implement "Generate More" functionality

**Generation Panel Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Generate Creative                                              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ 💡 Concepts      │  │ ✍️ Copy          │  │ 🖼 Images    │  │
│  │                  │  │                  │  │ (Coming)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
│  [ Generate Concepts ]                                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Generated Concepts (4)                                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Summer State of Mind                                      │ │
│  │ "Your summer just got an upgrade"                         │ │
│  │ "Made for moments that matter"                            │ │
│  │ "Warm, golden-hour lighting..."                           │ │
│  │                                                           │ │
│  │ [ Select ] [ Generate Copy ] [ Generate Image ]           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Bold Statements                                           │ │
│  │ ...                                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Day 4: Asset Management

- [ ] Build `AssetGrid` component
- [ ] Implement asset selection (multi-select)
- [ ] Add asset status badges
- [ ] Create asset deletion (draft only)
- [ ] Build asset version tracking

**Asset States:**
```typescript
const ASSET_STATUSES = {
  draft: { label: 'Draft', color: 'text-secondary' },
  agency_review: { label: 'Agency Review', color: 'info' },
  submitted: { label: 'Submitted', color: 'warning' },
  brand_review: { label: 'In Review', color: 'info' },
  changes_requested: { label: 'Changes Requested', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' }
}
```

**Asset Actions by Status:**
```
Draft:
  - Edit
  - Delete
  - Submit for Agency Review (if agency)
  - Submit for Brand Review (if brand)

Agency Review:
  - Approve (internal)
  - Request Changes (internal)
  - Submit to Brand

Submitted / Brand Review:
  - View only (agency)
  - Approve / Reject / Request Changes (brand)
```

### Day 5: Campaign Detail Integration

- [ ] Integrate generation panel into campaign detail
- [ ] Add tabs: Brief | Generated | Assets
- [ ] Show generation history
- [ ] Implement asset filtering by type/status
- [ ] Polish loading and empty states
- [ ] Show generation mode badge: "Brand-Grounded" or "Idea-First"

**Campaign Detail Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Q3 Summer Collection Campaign                    [ Edit Brief ]│
│  Created 2 days ago by Jane Smith                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Brief] [Generated] [All Assets]                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  Brief Tab: Show campaign brief details                   │ │
│  │                                                           │ │
│  │  Generated Tab: Generation panel + results                │ │
│  │                                                           │ │
│  │  All Assets Tab: Grid of all assets with filters          │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### TanStack Query for Data Fetching & Caching

**Install TanStack Query:**
```bash
pnpm add @tanstack/react-query
```

**Setup QueryClient in App.tsx:**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  )
}
```

**Campaign & Assets Queries:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch campaign with assets
export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaign(campaignId),
  })
}

// Fetch campaign assets with filters
export function useCampaignAssets(campaignId: string, filters?: AssetFilters) {
  return useQuery({
    queryKey: ['campaign-assets', campaignId, filters],
    queryFn: () => fetchCampaignAssets(campaignId, filters),
  })
}

// Generate concepts mutation
export function useGenerateConcepts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: generateConcepts,
    onSuccess: (data, variables) => {
      // Invalidate assets query to refetch
      queryClient.invalidateQueries({ 
        queryKey: ['campaign-assets', variables.campaign_id] 
      })
    },
  })
}

// Usage in component
function GenerationPanel({ campaignId }: { campaignId: string }) {
  const { data: assets, isLoading } = useCampaignAssets(campaignId)
  const generateMutation = useGenerateConcepts()
  
  const handleGenerate = () => {
    generateMutation.mutate({ campaign_id: campaignId, brand_id, brief })
  }
  
  return (
    <div>
      <Button 
        onClick={handleGenerate}
        isLoading={generateMutation.isPending}
      >
        Generate Concepts
      </Button>
      
      {isLoading ? (
        <GenerationLoadingState />
      ) : (
        <AssetGrid assets={assets} />
      )}
    </div>
  )
}
```

### Benefits of TanStack Query for This Sprint

| Feature | Benefit |
|---------|---------|
| **Automatic caching** | Campaign/assets cached, no duplicate fetches |
| **Loading/error states** | `isLoading`, `isError`, `error` built-in |
| **Invalidation** | After generation, assets auto-refetch |
| **Background refetch** | Assets refresh when tab regains focus |
| **Optimistic updates** | Can show concepts immediately while saving |

### Optimistic UI Updates

While generating, show:
1. Loading skeleton cards
2. Progress indicator
3. "Generating 4 concepts..." message

```typescript
// Optimistic update example
const generateMutation = useMutation({
  mutationFn: generateConcepts,
  onMutate: async () => {
    // Show optimistic loading state
  },
  onSuccess: (data) => {
    // Replace optimistic data with real data
  },
  onError: (error) => {
    // Revert optimistic update, show error
  },
})
```

### Error Handling

```typescript
function GenerationPanel() {
  const generateMutation = useGenerateConcepts()
  
  useEffect(() => {
    if (generateMutation.isError) {
      const error = generateMutation.error
      if (error.code === 'RATE_LIMITED') {
        toast.error('Too many requests. Please wait a moment.')
      } else if (error.code === 'MODEL_ERROR') {
        toast.error('Generation failed. Please try again.')
      } else {
        toast.error('Something went wrong.')
      }
    }
  }, [generateMutation.isError])
}
```

### State Management

**Use TanStack Query for server state, Zustand only for client state:**

```typescript
// Zustand: only for UI state (not server data)
interface CampaignUIState {
  selectedAssets: string[]
  generationType: 'concept' | 'copy' | 'image' | null
  
  selectAsset: (id: string) => void
  deselectAsset: (id: string) => void
  clearSelection: () => void
}

// TanStack Query: all server data
// - useCampaign(id) for campaign details
// - useCampaignAssets(id, filters) for assets
// - useGenerateConcepts() for generation
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate/concepts` | Generate campaign concepts |
| POST | `/api/generate/copy` | Generate copy variants |
| GET | `/api/assets` | List assets (with filters) |
| GET | `/api/assets/:id` | Get single asset |
| PUT | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Delete draft asset |

---

## Acceptance Criteria

- [ ] Users can generate 4 concepts with one click
- [ ] Generated concepts show brand-grounded content
- [ ] Users can generate concepts/copy from text-only seed when no brand assets exist
- [ ] Users can generate copy from brief or concept
- [ ] Assets are saved with correct status and type
- [ ] Asset grid displays all campaign assets
- [ ] Multi-select works for batch actions
- [ ] Loading states are smooth and informative
- [ ] Errors are handled gracefully

---

## Test Scenarios

1. **Generate concepts:** Campaign → Generate → See 4 concepts → Verify tone matches brand
2. **Generate copy from concept:** Select concept → Generate Copy → See 5 variants
3. **Asset management:** Generate → View in grid → Select multiple → Verify selection
4. **Error recovery:** Simulate API error → See error message → Retry successfully
5. **Idea-first generation:** No logo/colours/fonts configured → Enter seed idea → Generate usable concepts/copy

---

## Dependencies for Next Sprint

Sprint 06 requires:
- Concept generation working
- Copy generation working
- Assets saving correctly
- Campaign detail page functional
- Idea-first and brand-first generation modes both operational

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Generation taking too long | Show progress, add timeout |
| Poor concept quality | Iterate on prompts, add regeneration |
| Asset state complexity | Clear status documentation |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **TanStack Query** | Automatic caching, loading states, cache invalidation after generation |
| **shadcn Tabs** | Pre-built accessible tabs for Brief/Generated/Assets |
| **shadcn Skeleton** | Loading placeholders during generation |
| **Sonner** | Toast notifications for generation status |

**Install additional shadcn components:**
```bash
pnpm dlx shadcn@latest add tabs
```

---

*Sprint 05 of 10 — Generation Phase*
