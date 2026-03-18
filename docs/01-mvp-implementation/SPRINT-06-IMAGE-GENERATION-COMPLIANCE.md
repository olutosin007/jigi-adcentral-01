# Sprint 06 — Image Generation & Compliance

**Duration:** Week 6 (5 days)  
**Phase:** Generation (3 of 3)  
**Goal:** Implement image generation and AI compliance checking

---

## Sprint Objectives

1. Integrate DALL-E 3 for image generation
2. Build image generation UI with brand context
3. Implement compliance checking system
4. Polish the complete generation workflow
5. Ensure image generation and compliance work for idea-first campaigns with no brand assets

---

## Deliverables

### Day 1: DALL-E 3 Integration

- [ ] Create DALL-E 3 adapter in AI orchestrator
- [ ] Build image prompt construction logic
- [ ] Add fallback style prompt construction for no-brand campaigns
- [ ] Handle image response and storage
- [ ] Add generation options (size, quality)
- [ ] Test image generation end-to-end

**DALL-E Adapter:**
```typescript
// packages/api/lib/ai/adapters/azure-dalle.ts

class AzureDALLE3 implements AIModel {
  name = 'dall-e-3'
  
  async generate(prompt: string, options?: ImageOptions): Promise<string> {
    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_DALLE}/images/generations?api-version=2024-02-01`,
      {
        method: 'POST',
        headers: {
          'api-key': process.env.AZURE_OPENAI_API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          size: options?.size ?? '1024x1024',
          quality: options?.quality ?? 'standard',
          n: 1
        })
      }
    )
    
    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error.message)
    }
    
    return data.data[0].url
  }
}
```

**Image Prompt Construction:**
```typescript
function buildImagePrompt(
  concept: ConceptAsset,
  brand?: BrandConstraints
): string {
  const colourList = brand?.identity?.colours?.length
    ? brand.identity.colours.map(c => c.hex).join(', ')
    : 'Use a neutral, modern palette with one teal accent'
  
  return `
Create a professional advertising image with the following specifications:

VISUAL DIRECTION:
${concept.content.visual_direction}

BRAND COLOURS (use these prominently):
${colourList}

STYLE:
- Modern, high-quality advertising photography
- Clean composition suitable for ${concept.channels?.join(', ')}
- Professional lighting
- No text or logos in the image

MOOD:
${brand?.voice?.tone?.join(', ') ?? 'clear, modern, confident'}

Create a photorealistic, high-quality image suitable for advertising.
`.trim()
}
```

### Day 2: Image Generation API & Storage

- [ ] Create `/api/generate/image` endpoint
- [ ] Download generated image from DALL-E URL
- [ ] Upload to Supabase Storage
- [ ] Save asset with storage URL
- [ ] Handle image generation errors
- [ ] Allow generation when `brand_id` is not available

**Endpoint: POST /api/generate/image**
```typescript
export default async function handler(req, res) {
  const { campaign_id, concept_id, brand_id } = req.body
  
  const supabase = createClient(req)
  
  // Fetch concept and brand (brand optional for idea-first)
  const { data: concept } = await supabase
    .from('creative_assets')
    .select('*')
    .eq('id', concept_id)
    .single()
    
  let brand = null
  if (brand_id) {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brand_id)
      .single()
    brand = data
  }
  
  // Generate image
  const orchestrator = new AIOrchestrator()
  const imageUrl = await orchestrator.generateImage({
    concept: concept.content,
    brand: {
      identity: brand?.identity ?? {},
      voice: brand?.voice ?? {}
    }
  })
  
  // Download and store
  const imageResponse = await fetch(imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  
  const filename = `${campaign_id}/${Date.now()}.png`
  const { data: uploadData } = await supabase.storage
    .from('generated-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/png'
    })
  
  const publicUrl = supabase.storage
    .from('generated-images')
    .getPublicUrl(filename).data.publicUrl
  
  // Save asset
  const { data: asset } = await supabase
    .from('creative_assets')
    .insert({
      campaign_id,
      created_by: req.user.id,
      type: 'image',
      generation_mode: brand ? 'brand_grounded' : 'idea_first',
      content: {
        url: publicUrl,
        prompt_used: concept.content.visual_direction,
        model: 'dall-e-3',
        concept_id
      },
      status: 'draft'
    })
    .select()
    .single()
  
  return res.json({ asset })
}
```

### Day 3: Image Generation UI

- [ ] Add "Generate Image" button to concept cards
- [ ] Build image preview modal
- [ ] Show generation progress (DALL-E can be slow)
- [ ] Display generated images in asset grid
- [ ] Add image regeneration option

**Image Generation UI Flow:**
```
1. User clicks "Generate Image" on concept card
2. Show loading state with "Generating image... (15-30 seconds)"
3. Image appears in modal when ready
4. User can:
   - Save to assets
   - Regenerate
   - Close without saving
```

**Image Preview Modal:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Generated Image                                          [ X ] │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                                                           │ │
│  │                    [Generated Image]                      │ │
│  │                                                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Based on concept: "Summer State of Mind"                       │
│                                                                 │
│  [ Regenerate ]                   [ Discard ]  [ Save to Assets]│
└─────────────────────────────────────────────────────────────────┘
```

### Day 4: Compliance Check System

- [ ] Create `/api/generate/compliance-check` endpoint
- [ ] Build compliance check prompt template
- [ ] Implement automatic check on generation
- [ ] Display compliance results in UI
- [ ] Add manual compliance recheck option
- [ ] Add baseline compliance mode for idea-first campaigns

**Compliance Check Prompt:**
```typescript
const COMPLIANCE_PROMPT = `
You are a brand compliance checker. Review the following creative content against brand guidelines.

CONTENT TO CHECK:
Type: {{asset.type}}
Content: {{asset.content | json}}

BRAND GUIDELINES:
- Required tone: {{brand.voice.tone | join(", ") | default("clear, audience-appropriate")}}
- Preferred words: {{brand.voice.preferred_words | join(", ") | default("none")}}
- Avoided words: {{brand.voice.avoided_words | join(", ") | default("none")}}
{{#if brand.identity.colours}}
- Brand colours: {{brand.identity.colours | json}}
{{/if}}

CHECK FOR:
1. tone_alignment - Does the content match the required tone?
2. language_compliance - Are preferred words used? Are avoided words present?
3. legal_flags - Any claims that might need legal review?

Return ONLY valid JSON in this exact format:
{
  "passed": true/false,
  "checks": [
    { "name": "tone_alignment", "status": "pass|warn|fail", "message": "..." },
    { "name": "language_compliance", "status": "pass|warn|fail", "message": "..." },
    { "name": "legal_flags", "status": "pass|warn|fail", "message": "..." }
  ]
}
`
```

**Compliance UI:**
```
┌───────────────────────────────────────────────────────────────┐
│ Compliance Check                                              │
│                                                               │
│ ✓ Tone Alignment                                    Pass      │
│   Content matches brand tone: confident, warm                 │
│                                                               │
│ ✓ Language Compliance                               Pass      │
│   No avoided words detected                                   │
│                                                               │
│ ⚠ Legal Flags                                       Warning   │
│   "Best in class" claim may need substantiation              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Day 5: Generation Polish & Integration

- [ ] Add generation history view
- [ ] Implement batch generation (multiple concepts → multiple images)
- [ ] Add generation cost tracking (tokens used)
- [ ] Polish error states and retry logic
- [ ] Complete end-to-end generation flow testing
- [ ] Include mode label in logs: `brand_grounded` or `idea_first`

**Generation History:**
```typescript
// Show recent generations in campaign sidebar
interface GenerationLogEntry {
  id: string
  type: 'concept' | 'copy' | 'image' | 'compliance'
  model: string
  created_at: string
  status: 'success' | 'error'
  latency_ms: number
  tokens_used?: number
}
```

**Error Recovery:**
```typescript
async function generateWithRetry(
  request: GenerationRequest,
  maxRetries = 2
): Promise<GenerationResult> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await orchestrator.generate(request)
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      // Wait before retry (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)))
    }
  }
}
```

---

## Technical Notes

### Image Storage

Create Supabase Storage bucket:
- Name: `generated-images`
- Public: Yes (for simplicity in MVP)
- Max file size: 5MB

### Generation Timing

| Type | Typical Latency |
|------|-----------------|
| Concepts (GPT-4o-mini) | 2-5 seconds |
| Copy (GPT-4o-mini) | 2-4 seconds |
| Image (DALL-E 3) | 15-30 seconds |
| Compliance (GPT-4o-mini) | 1-2 seconds |

### Cost Tracking

```typescript
// Log token usage for cost monitoring
await supabase.from('generation_log').insert({
  user_id: req.user.id,
  brand_id,
  campaign_id,
  type: 'image',
  model: 'dall-e-3',
  status: 'success',
  latency_ms: 18500,
  tokens_used: null // DALL-E priced per image, not tokens
})
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate/image` | Generate image from concept |
| POST | `/api/generate/compliance-check` | Check asset compliance |
| GET | `/api/campaigns/:id/generation-log` | Get generation history |

---

## Acceptance Criteria

- [ ] Images generate from concepts in 15-30 seconds
- [ ] Generated images display correctly in UI
- [ ] Images are stored in Supabase and persist
- [ ] Compliance check runs automatically on generation
- [ ] Compliance results display clearly
- [ ] Idea-first campaigns can generate images and receive baseline compliance feedback
- [ ] Failed generations show meaningful errors
- [ ] Retry logic handles transient failures
- [ ] Generation history is tracked

---

## Test Scenarios

1. **Generate image:** Concept → Generate Image → View → Save → Appears in grid
2. **Compliance pass:** Generate compliant copy → See all green checks
3. **Compliance warning:** Include "best ever" claim → See legal flag warning
4. **Error handling:** Kill network mid-generation → See error → Retry → Success
5. **Regeneration:** Generate image → Regenerate → Get different image
6. **Idea-first image flow:** No brand profile assets → Generate image + compliance result still returned

---

## Dependencies for Next Sprint

Sprint 07 requires:
- All generation types working
- Assets saving correctly
- Compliance system functional
- Image storage configured

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| DALL-E 3 slow/timeout | Generous timeout (60s), clear progress UI |
| Image quality inconsistent | Allow regeneration, iterate on prompts |
| Compliance too strict/lenient | Tune prompt, allow manual override |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **TanStack Query** | Image generation mutations with loading states, cache invalidation |
| **shadcn Dialog** | Image preview modal |
| **shadcn Progress** | Generation progress indicator |
| **shadcn Badge** | Compliance status badges (Pass, Warning, Flag) |

**Add shadcn Progress:**
```bash
pnpm dlx shadcn@latest add progress
```

**Image Generation with TanStack Query:**
```typescript
export function useGenerateImage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: generateImage,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['campaign-assets', variables.campaign_id] 
      })
    },
  })
}

// Usage with progress
function ImageGenerationButton({ conceptId, campaignId }) {
  const generateMutation = useGenerateImage()
  
  return (
    <Button 
      onClick={() => generateMutation.mutate({ concept_id: conceptId, campaign_id: campaignId })}
      disabled={generateMutation.isPending}
    >
      {generateMutation.isPending ? (
        <>
          <Spinner className="mr-2" />
          Generating...
        </>
      ) : (
        'Generate Image'
      )}
    </Button>
  )
}
```

---

*Sprint 06 of 10 — Generation Phase*
