# Sprint 04 — Campaigns & AI Setup

**Duration:** Week 4 (5 days)  
**Phase:** Generation (1 of 3)  
**Goal:** Build campaign management and establish AI infrastructure

---

## Sprint Objectives

1. Create campaigns table and management UI
2. **Build Campaign List page UI**
3. **Build Campaign Create page UI (brief form)**
4. **Build Campaign Detail page UI (tabs: Brief/Generated/Assets)**
5. Set up Azure OpenAI integration
6. Build the AI Orchestrator service
7. Create prompt templates for brand-grounded generation
8. Enable campaign creation from text-only idea when brand assets are missing

---

## UI Components to Build This Sprint

| Component | Description |
|-----------|-------------|
| `CampaignListPage` | Grid/list of campaigns with status and asset counts |
| `CampaignCard` | Card showing campaign name, status, last updated |
| `CampaignCreatePage` | Form for creating new campaign with brief fields |
| `BriefForm` | Form with objective, audience, channels, requirements |
| `ChannelSelector` | Multi-select for choosing target channels |
| `CampaignDetailPage` | Tabbed view: Brief / Generated / All Assets |
| `CampaignTabs` | Tab navigation component |
| `BriefTab` | Displays campaign brief in readable format |

---

## Deliverables

### Day 1: Database Schema (Campaigns & Assets)

- [ ] Create `campaigns` table migration
- [ ] Create `creative_assets` table migration
- [ ] Create `generation_log` table migration
- [ ] Set up RLS policies for campaigns
- [ ] Apply migrations and test
- [ ] Add campaign journey metadata (`brand_first` / `idea_first`)

**Migration: campaigns**
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    
    name TEXT NOT NULL,
    brief JSONB DEFAULT '{}',
    -- Structure: { 
    --   objective: "", 
    --   audience: "", 
    --   channels: [], 
    --   requirements: "" 
    -- }
    
    journey_mode TEXT DEFAULT 'brand_first' CHECK (journey_mode IN ('brand_first', 'idea_first')),
    seed_idea TEXT,
    status TEXT DEFAULT 'draft' 
        CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Migration: creative_assets**
```sql
CREATE TABLE creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    
    type TEXT NOT NULL CHECK (type IN ('concept', 'copy', 'image')),
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    content JSONB NOT NULL,
    -- Structure varies by type:
    -- concept: { theme: "", headlines: [], visual_direction: "", rationale: "" }
    -- copy: { headlines: [], body: "", cta: "" }
    -- image: { url: "", prompt_used: "", model: "" }
    
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES creative_assets(id),
    
    status TEXT DEFAULT 'draft' 
        CHECK (status IN (
            'draft', 
            'agency_review', 
            'submitted', 
            'brand_review', 
            'changes_requested', 
            'approved', 
            'rejected'
        )),
    
    compliance_check JSONB DEFAULT '{}',
    -- Structure: { passed: bool, checks: [{ name: "", status: "", message: "" }] }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER assets_updated_at
    BEFORE UPDATE ON creative_assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Migration: generation_log**
```sql
CREATE TABLE generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    brand_id UUID REFERENCES brands(id),
    campaign_id UUID REFERENCES campaigns(id),
    
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    generation_mode TEXT NOT NULL CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    prompt_hash TEXT,
    
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    latency_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Day 2: Campaign Management UI

- [ ] Build Campaign List page
- [ ] Build Campaign Create page
- [ ] Build Campaign Detail page
- [ ] Add campaign brief form
- [ ] Implement campaign status management
- [ ] Add "Start from idea" campaign path (minimal required fields)

**Campaign Brief Form Fields:**
```typescript
interface CampaignBrief {
  objective: string       // Required: What the campaign should achieve
  audience: string        // Required: Target audience description
  channels: string[]      // Required: Where creative will appear
  requirements: string    // Optional: Specific constraints
}

const CHANNEL_OPTIONS = [
  'instagram_post', 'instagram_story', 'instagram_reel',
  'facebook_post', 'facebook_ad',
  'twitter_post', 'linkedin_post',
  'display_ad', 'email_header',
  'website_banner', 'other'
]
```

**Idea-First quick start fields (minimum):**
```typescript
interface IdeaFirstBrief {
  seed_idea: string        // Required: user's text starting point
  audience?: string        // Optional
  channels: string[]       // At least one
}
```

**Campaign List UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Campaigns                           [ + New Campaign ]         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Q3 Summer Collection                        Draft        │   │
│  │ Created 2 days ago • 4 assets                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Product Launch 2026                         Active       │   │
│  │ Created 1 week ago • 12 assets • 3 pending review        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Day 3: Azure OpenAI Integration

- [ ] Set up Azure OpenAI client in `packages/api`
- [ ] Configure GPT-4o-mini deployment
- [ ] Configure DALL-E 3 deployment
- [ ] Create model adapter interfaces
- [ ] Test basic text generation

**Azure OpenAI Client:**
```typescript
// packages/api/lib/ai/adapters/azure-openai.ts

interface AIModel {
  name: string
  generate(prompt: string, options?: GenerationOptions): Promise<string>
}

class AzureGPT4oMini implements AIModel {
  name = 'gpt-4o-mini'
  
  async generate(prompt: string, options?: GenerationOptions): Promise<string> {
    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_GPT}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'api-key': process.env.AZURE_OPENAI_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000
        })
      }
    )
    
    const data = await response.json()
    return data.choices[0].message.content
  }
}
```

### Day 4: AI Orchestrator Service

- [ ] Create AI Orchestrator class
- [ ] Implement model selection logic
- [ ] Build brand constraint injection
- [ ] Add fallback constraint builder for missing brand assets
- [ ] Create generation request/response types
- [ ] Add error handling and logging

**AI Orchestrator:**
```typescript
// packages/api/lib/ai/orchestrator.ts

interface GenerationRequest {
  type: 'concept' | 'copy' | 'image'
  brand?: BrandConstraints
  fallback_context?: {
    seed_idea: string
    audience?: string
    style_hints?: string[]
  }
  brief: CampaignBrief
  options?: {
    quality?: 'draft' | 'production'
    count?: number
  }
}

interface BrandConstraints {
  name: string
  identity: {
    colours: Array<{ hex: string; role: string }>
    fonts: { heading: string; body: string }
  }
  voice: {
    tone: string[]
    preferred_words: string[]
    avoided_words: string[]
    samples: string[]
  }
  strategy?: {
    positioning: string
    differentiators: string[]
  }
}

class AIOrchestrator {
  private gptModel: AzureGPT4oMini
  
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const model = this.selectModel(request)
    const prompt = this.buildPrompt(request)
    
    const startTime = Date.now()
    const result = await model.generate(prompt)
    const latencyMs = Date.now() - startTime
    
    await this.logGeneration(request, result, latencyMs)
    
    return this.parseResult(result, request.type)
  }
  
  private selectModel(request: GenerationRequest): AIModel {
    // For MVP, always use GPT-4o-mini for text
    if (request.type === 'concept' || request.type === 'copy') {
      return this.gptModel
    }
    // Image generation handled separately
    throw new Error('Image generation handled by different method')
  }
  
  private buildPrompt(request: GenerationRequest): string {
    // Inject full brand constraints when available.
    // Otherwise inject fallback context from seed idea + brief.
    // See Day 5 for prompt templates
  }
}
```

### Day 5: Prompt Templates

- [ ] Create concept generation prompt template
- [ ] Create copy generation prompt template
- [ ] Create compliance check prompt template
- [ ] Implement template variable injection
- [ ] Test prompts with sample brand data
- [ ] Test prompts with text-only idea input (no brand assets)

**Concept Generation Prompt:**
```typescript
const CONCEPT_PROMPT = `
You are a senior creative strategist generating advertising campaign concepts.

BRAND CONSTRAINTS (follow exactly):
- Brand name: {{brand.name}}
- Colours: {{brand.identity.colours | json}}
- Tone of voice: {{brand.voice.tone | join(", ")}}
- Language to use: {{brand.voice.preferred_words | join(", ")}}
- Language to avoid: {{brand.voice.avoided_words | join(", ")}}
{{#if brand.strategy.positioning}}
- Brand positioning: {{brand.strategy.positioning}}
{{/if}}

BRIEF:
- Campaign objective: {{brief.objective}}
- Target audience: {{brief.audience}}
- Channels: {{brief.channels | join(", ")}}
- Specific requirements: {{brief.requirements}}

TASK:
Generate 4 distinct campaign concept directions. For each concept, provide:
1. Theme/Big Idea (2-4 words)
2. 3 headline variants
3. Visual direction description (2-3 sentences)
4. Brief rationale (1 sentence)

Each concept must:
- Align with the brand tone exactly
- Use preferred language, avoid listed words
- Be distinct from the other concepts
- Be executable across the listed channels

Return valid JSON in this exact format:
{
  "concepts": [
    {
      "theme": "Theme Name",
      "headlines": ["Headline 1", "Headline 2", "Headline 3"],
      "visual_direction": "Description of visuals...",
      "rationale": "Why this concept works..."
    }
  ]
}
`
```

**Copy Generation Prompt:**
```typescript
const COPY_PROMPT = `
You are an expert copywriter creating advertising copy for a brand.

BRAND VOICE:
- Tone: {{brand.voice.tone | join(", ")}}
- Use these words/phrases: {{brand.voice.preferred_words | join(", ")}}
- Never use: {{brand.voice.avoided_words | join(", ")}}
{{#if brand.voice.samples}}
- Style reference: {{brand.voice.samples[0]}}
{{/if}}

BRIEF:
- Objective: {{brief.objective}}
- Audience: {{brief.audience}}
- Format: {{format}}

Generate 5 copy variants. Each should include:
- Headline (attention-grabbing, on-brand)
- Body copy (2-3 sentences)
- Call to action

Return valid JSON:
{
  "variants": [
    {
      "headline": "...",
      "body": "...",
      "cta": "..."
    }
  ]
}
`
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns for brand |
| POST | `/api/campaigns` | Create new campaign |
| GET | `/api/campaigns/:id` | Get campaign with assets |
| PUT | `/api/campaigns/:id` | Update campaign |
| POST | `/api/generate/concepts` | Generate campaign concepts |

---

## Acceptance Criteria

- [ ] Campaigns can be created with brief fields
- [ ] Campaign list shows all campaigns for brand
- [ ] Campaign detail page displays brief and assets
- [ ] Azure OpenAI connection works
- [ ] Prompt templates correctly inject brand data
- [ ] Campaign can be created and generated from text-only idea
- [ ] Generation logs are saved to database
- [ ] Error handling works for API failures

---

## Test Scenarios

1. **Create campaign:** Fill brief → Save → Verify in database
2. **Generate concepts:** Select brand → Create campaign → Generate → View concepts
3. **AI error handling:** Disconnect network → Generate → See error message
4. **Brand injection:** Generate for 2 different brands → Verify different tone
5. **Idea-first flow:** No brand assets → Enter seed idea → Generate concepts successfully

---

## Dependencies for Next Sprint

Sprint 05 requires:
- Campaign CRUD working
- AI Orchestrator functional
- Prompt templates tested
- Azure OpenAI integration complete
- Fallback prompt path working for idea-first campaigns

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Azure credits running low | Monitor usage, set alerts |
| Prompt quality poor | Iterate on templates with real examples |
| JSON parsing failures | Add robust error handling, retries |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **react-hook-form** | Campaign brief form with validation |
| **zod** | Brief schema validation (required fields, string lengths) |
| **shadcn Form** | Form components with accessible labels, error messages |
| **shadcn Card** | Campaign cards for list view |
| **shadcn Tabs** | Campaign detail tabs (Brief, Generated, Assets) |

**Brief Form with react-hook-form:**
```typescript
const briefSchema = z.object({
  objective: z.string().min(10, 'Objective must be at least 10 characters'),
  target_audience: z.string().min(10),
  key_messages: z.array(z.string()).min(1, 'Add at least one key message'),
  channels: z.array(z.string()).min(1, 'Select at least one channel'),
  deliverables: z.object({
    concepts: z.number().min(1).max(8),
    copy_variants: z.number().min(1).max(10),
    image_variants: z.number().min(0).max(6),
  }),
})

function CampaignBriefForm() {
  const form = useForm({
    resolver: zodResolver(briefSchema),
    defaultValues: { /* ... */ },
  })
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Objective</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields */}
      </form>
    </Form>
  )
}
```

---

*Sprint 04 of 10 — Generation Phase*
