# Sprint 09A — Backend Wiring & Service Integration

**Duration:** Week 9.5 (5 days)  
**Phase:** Integration (Pre-Launch)  
**Goal:** Wire up all backend services, provision 3rd-party platforms, and create secure API routes

---

## Sprint Context

Sprints 01-09 built a comprehensive **frontend shell** with UI components, database migrations, and client-side service adapters. However, these services are currently:

1. **Using mock data** when APIs are not configured
2. **Making client-side calls** with exposed API keys (security risk)
3. **Not connected** to real Supabase, Azure OpenAI, Resend, or Replicate

This sprint wires everything together for a functional MVP.

---

## Sprint Objectives

1. **Provision Supabase** — Create project, apply migrations, configure storage
2. **Provision Replicate** — Set up Flux Schnell for cost-effective image generation
3. **Provision Azure OpenAI** — Deploy GPT-4o-mini for text generation
4. **Provision Resend** — Configure email notifications
5. **Create Vercel API routes** — Move sensitive operations server-side
6. **Secure API keys** — Remove client-exposed keys, use server-only env vars
7. **Deploy to Vercel** — Production deployment with all services connected
8. **Test end-to-end flows** — Verify complete user journeys work

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vite/React)                        │
│                    Deployed on Vercel Edge Network                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VERCEL SERVERLESS API ROUTES                      │
│                                                                      │
│  /api/generate/concepts     → Azure GPT-4o-mini                     │
│  /api/generate/copy         → Azure GPT-4o-mini                     │
│  /api/generate/image        → Replicate Flux Schnell (primary)      │
│  /api/generate/image-hd     → Azure DALL-E 3 (premium option)       │
│  /api/generate/compliance   → Azure GPT-4o-mini                     │
│  /api/assets/*              → Supabase                              │
│  /api/notifications/*       → Supabase + Resend                     │
│  /api/cron/nudge            → Scheduled nudge checks                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│    SUPABASE      │  │   AI PROVIDERS       │  │    RESEND        │
│                  │  │                      │  │                  │
│  • PostgreSQL    │  │  • Azure GPT-4o-mini │  │  Transactional   │
│  • Auth          │  │  • Replicate Flux    │  │  Email           │
│  • Storage       │  │  • Azure DALL-E 3    │  │                  │
│  • RLS Policies  │  │    (premium only)    │  │                  │
└──────────────────┘  └──────────────────────┘  └──────────────────┘
```

---

## Image Generation Strategy: Cost-Optimized

**Primary Model: Replicate Flux Schnell**
- Cost: $0.003/image (13x cheaper than DALL-E 3)
- Speed: 1-4 seconds
- Quality: Good for drafts and iteration

**Premium Model: Azure DALL-E 3** (opt-in only)
- Cost: $0.040/image
- Speed: 15-30 seconds
- Quality: Best for final/production assets

**Model Selection Logic:**
```typescript
// Default: Flux Schnell for all generations
// Premium: DALL-E 3 only when user explicitly selects "HD Quality"

interface ImageGenerationRequest {
  quality: 'draft' | 'hd'  // draft = Flux, hd = DALL-E 3
}
```

**MVP Cost Projection:**
| Usage Level | Images/Month | Flux Cost | DALL-E Cost | Savings |
|-------------|--------------|-----------|-------------|---------|
| Light       | 200          | $0.60     | $8.00       | 93%     |
| Moderate    | 500          | $1.50     | $20.00      | 92%     |
| Heavy       | 1000         | $3.00     | $40.00      | 92%     |

---

## Deliverables

### Day 1: Supabase Provisioning & Database Setup

#### User Actions Required
- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project (name: `jigi-mvp`)
- [ ] Copy Project URL and Anon Key
- [ ] Copy Service Role Key (for server-side)

#### Implementation Tasks
- [ ] Create `.env.local` with real Supabase credentials
- [ ] Apply all 14 migrations via SQL Editor or CLI
- [ ] Create storage buckets with policies
- [ ] Configure auth settings (email templates, redirects)
- [ ] Test auth flow (signup, login, password reset)
- [ ] Verify RLS policies allow correct access

**Migrations to Apply:**
```
001_organisations.sql
002_users.sql
003_rls_policies.sql
004_brands.sql
005_agency_brand_access.sql
006_campaigns.sql
007_creative_assets.sql
008_generation_log.sql
009_generated_images_bucket.sql
010_asset_status_history.sql
011_approval_actions.sql
012_asset_comments.sql
013_notifications.sql
014_nudge_log.sql
```

**Storage Buckets to Create:**
```sql
-- Run in SQL Editor after migrations

-- Brand assets bucket (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true);

-- Generated images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true);

-- Storage policies (allow authenticated uploads)
CREATE POLICY "Users can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Users can upload generated images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Public read for brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');

CREATE POLICY "Public read for generated images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-images');
```

**Auth Configuration:**
1. Navigate to Authentication → Settings
2. Set Site URL: `http://localhost:5173` (dev) / `https://your-app.vercel.app` (prod)
3. Add redirect URLs for password reset
4. Enable email confirmations (optional for MVP)

---

### Day 2: AI Providers Setup & Replicate Integration

#### User Actions Required
- [ ] Create Replicate account at [replicate.com](https://replicate.com)
- [ ] Generate API token
- [ ] Create Azure account (if not existing)
- [ ] Create Azure OpenAI resource
- [ ] Deploy GPT-4o-mini model
- [ ] Deploy DALL-E 3 model (for HD option)

#### Implementation Tasks
- [ ] Create `/api/` directory in project root for Vercel functions
- [ ] Create Replicate Flux adapter (server-side)
- [ ] Create `/api/generate/concepts` route
- [ ] Create `/api/generate/copy` route
- [ ] Create `/api/generate/image` route (Flux primary)
- [ ] Create `/api/generate/image-hd` route (DALL-E 3 premium)
- [ ] Create `/api/generate/compliance-check` route
- [ ] Update frontend to call server endpoints

**Project Structure Update:**
```
jigi-app/
├── api/                          # Vercel Serverless Functions
│   ├── generate/
│   │   ├── concepts.ts
│   │   ├── copy.ts
│   │   ├── image.ts              # Flux Schnell (primary)
│   │   ├── image-hd.ts           # DALL-E 3 (premium)
│   │   └── compliance-check.ts
│   ├── assets/
│   │   ├── [id]/
│   │   │   ├── submit.ts
│   │   │   ├── approve.ts
│   │   │   ├── reject.ts
│   │   │   └── request-changes.ts
│   │   └── comments.ts
│   ├── notifications/
│   │   └── send-email.ts
│   ├── cron/
│   │   └── nudge.ts
│   └── lib/
│       ├── supabase.ts           # Server-side Supabase client
│       ├── replicate.ts          # Replicate Flux adapter
│       ├── azure-openai.ts       # Azure OpenAI adapter
│       └── resend.ts             # Resend email client
├── src/                          # Existing frontend code
└── vercel.json                   # Vercel configuration
```

**Replicate Flux Adapter:**
```typescript
// api/lib/replicate.ts

import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export interface FluxGenerationOptions {
  prompt: string
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
  num_outputs?: number
  output_format?: 'webp' | 'jpg' | 'png'
  output_quality?: number
}

export async function generateImageWithFlux(
  options: FluxGenerationOptions
): Promise<string[]> {
  const output = await replicate.run(
    'black-forest-labs/flux-schnell',
    {
      input: {
        prompt: options.prompt,
        aspect_ratio: options.aspect_ratio || '1:1',
        num_outputs: options.num_outputs || 1,
        output_format: options.output_format || 'webp',
        output_quality: options.output_quality || 90,
      },
    }
  )

  return output as string[]
}

export async function generateImageWithFluxDev(
  options: FluxGenerationOptions
): Promise<string[]> {
  const output = await replicate.run(
    'black-forest-labs/flux-dev',
    {
      input: {
        prompt: options.prompt,
        aspect_ratio: options.aspect_ratio || '1:1',
        num_outputs: options.num_outputs || 1,
        output_format: options.output_format || 'webp',
        guidance: 3.5,
        num_inference_steps: 28,
      },
    }
  )

  return output as string[]
}
```

**Image Generation Endpoint (Flux Primary):**
```typescript
// api/generate/image.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { generateImageWithFlux } from '../lib/replicate'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { prompt, campaign_id, concept_id, brand_id } = req.body

  if (!prompt || !campaign_id) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const startTime = Date.now()

  try {
    // Generate with Flux Schnell
    const imageUrls = await generateImageWithFlux({
      prompt,
      aspect_ratio: '1:1',
      num_outputs: 1,
      output_format: 'webp',
    })

    const imageUrl = imageUrls[0]
    
    // Download image and upload to Supabase Storage
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    
    const filename = `${campaign_id}/${Date.now()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/webp',
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(filename)

    // Save asset to database
    const { data: asset, error: assetError } = await supabase
      .from('creative_assets')
      .insert({
        campaign_id,
        created_by: user.id,
        type: 'image',
        generation_mode: brand_id ? 'brand_grounded' : 'idea_first',
        content: {
          url: publicUrl,
          prompt_used: prompt,
          model: 'flux-schnell',
          concept_id,
        },
        status: 'draft',
      })
      .select()
      .single()

    if (assetError) {
      throw new Error(`Asset save failed: ${assetError.message}`)
    }

    const latencyMs = Date.now() - startTime

    // Log generation
    await supabase.from('generation_log').insert({
      user_id: user.id,
      brand_id,
      campaign_id,
      type: 'image',
      model: 'flux-schnell',
      generation_mode: brand_id ? 'brand_grounded' : 'idea_first',
      status: 'success',
      latency_ms: latencyMs,
    })

    return res.json({
      asset,
      image_url: publicUrl,
      model: 'flux-schnell',
      latency_ms: latencyMs,
    })

  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    // Log error
    await supabase.from('generation_log').insert({
      user_id: user.id,
      brand_id,
      campaign_id,
      type: 'image',
      model: 'flux-schnell',
      generation_mode: brand_id ? 'brand_grounded' : 'idea_first',
      status: 'error',
      latency_ms: latencyMs,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    })

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Image generation failed',
    })
  }
}
```

**Vercel Configuration:**
```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" }
  ],
  "crons": [
    {
      "path": "/api/cron/nudge",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

### Day 3: Asset Workflow API Routes

#### Implementation Tasks
- [ ] Create `/api/assets/[id]/submit` route
- [ ] Create `/api/assets/[id]/approve` route
- [ ] Create `/api/assets/[id]/reject` route
- [ ] Create `/api/assets/[id]/request-changes` route
- [ ] Create `/api/assets/comments` route
- [ ] Wire up status history recording
- [ ] Integrate notification triggers

**Submit Asset Endpoint:**
```typescript
// api/assets/[id]/submit.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['agency_review', 'submitted'],
  agency_review: ['draft', 'submitted'],
  submitted: ['brand_review'],
  brand_review: ['approved', 'rejected', 'changes_requested'],
  changes_requested: ['draft', 'submitted'],
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { target, message } = req.body

  // Auth check
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  // Fetch asset
  const { data: asset, error: fetchError } = await supabase
    .from('creative_assets')
    .select('*, campaigns(brand_id, name)')
    .eq('id', id)
    .single()

  if (fetchError || !asset) {
    return res.status(404).json({ error: 'Asset not found' })
  }

  // Validate transition
  const newStatus = target === 'brand_review' ? 'submitted' : 'agency_review'
  const validTransitions = STATUS_TRANSITIONS[asset.status] || []
  
  if (!validTransitions.includes(newStatus)) {
    return res.status(400).json({
      error: `Cannot transition from ${asset.status} to ${newStatus}`,
    })
  }

  // Update status
  const { data: updated, error: updateError } = await supabase
    .from('creative_assets')
    .update({ 
      status: newStatus,
      submission_note: message,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update asset' })
  }

  // Record status history
  await supabase.from('asset_status_history').insert({
    asset_id: id,
    user_id: user.id,
    from_status: asset.status,
    to_status: newStatus,
    notes: message,
  })

  // Trigger notifications (handled by separate service)
  // This will be called from frontend after successful submission

  return res.json({ asset: updated })
}
```

---

### Day 4: Email & Notification System Wiring

#### User Actions Required
- [ ] Create Resend account at [resend.com](https://resend.com)
- [ ] Verify domain (or use sandbox mode for testing)
- [ ] Generate API key

#### Implementation Tasks
- [ ] Create server-side Resend client
- [ ] Create `/api/notifications/send-email` route
- [ ] Create `/api/cron/nudge` route
- [ ] Test email delivery for all notification types
- [ ] Configure Vercel cron job

**Resend Client (Server-Side):**
```typescript
// api/lib/resend.ts

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail(params: SendEmailParams) {
  const fromEmail = process.env.EMAIL_FROM || 'Jigi <notifications@jigi.app>'
  
  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      console.error('[Resend] Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error) {
    console.error('[Resend] Exception:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

**Nudge Cron Endpoint:**
```typescript
// api/cron/nudge.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '../lib/resend'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = new Date().toISOString().split('T')[0]

  // Find assets pending > 24 hours
  const { data: pendingAssets, error } = await supabase
    .from('creative_assets')
    .select(`
      id,
      type,
      updated_at,
      campaigns (
        id,
        name,
        brand_id,
        brands (
          name,
          organisation_id
        )
      )
    `)
    .eq('status', 'brand_review')
    .lt('updated_at', twentyFourHoursAgo.toISOString())

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch pending assets' })
  }

  let nudgesSent = 0

  for (const asset of pendingAssets || []) {
    // Check if already nudged today
    const { data: existingNudge } = await supabase
      .from('nudge_log')
      .select('id')
      .eq('asset_id', asset.id)
      .gte('created_at', today)
      .limit(1)

    if (existingNudge && existingNudge.length > 0) {
      continue
    }

    // Get reviewers for this brand's organisation
    const orgId = (asset.campaigns as any)?.brands?.organisation_id
    if (!orgId) continue

    const { data: reviewers } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('organisation_id', orgId)
      .in('role', ['admin', 'approver'])

    for (const reviewer of reviewers || []) {
      const appUrl = process.env.APP_URL || 'http://localhost:5173'
      const reviewUrl = `${appUrl}/app/review/${asset.id}`

      // Send nudge email
      await sendEmail({
        to: reviewer.email,
        subject: `Reminder: Asset awaiting your review`,
        html: `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #D97706;">Friendly reminder</h2>
            <p>Hi ${reviewer.name || 'there'},</p>
            <p>You have an asset in <strong>"${(asset.campaigns as any)?.name}"</strong> waiting for your review.</p>
            <p>Quick reviews help your agency deliver faster!</p>
            <a href="${reviewUrl}" 
               style="display: inline-block; background: #0D9488; color: white; 
                      padding: 12px 24px; border-radius: 8px; text-decoration: none;
                      margin: 16px 0;">
              Review Now
            </a>
            <p style="color: #78716C; font-size: 14px;">— The Jigi Team</p>
          </div>
        `,
      })

      // Create in-app notification
      await supabase.from('notifications').insert({
        user_id: reviewer.id,
        type: 'nudge_reminder',
        title: 'Review reminder',
        body: `"${(asset.campaigns as any)?.name}" has assets waiting for your review`,
        related_asset_id: asset.id,
        related_campaign_id: (asset.campaigns as any)?.id,
      })

      // Log nudge
      await supabase.from('nudge_log').insert({
        asset_id: asset.id,
        user_id: reviewer.id,
        nudge_type: 'pending_24h',
        email_sent: true,
        notification_created: true,
      })

      nudgesSent++
    }
  }

  return res.json({
    processed: pendingAssets?.length || 0,
    nudges_sent: nudgesSent,
  })
}
```

---

### Day 5: Vercel Deployment & End-to-End Testing

#### User Actions Required
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Import project from Git repository
- [ ] Configure environment variables in Vercel dashboard

#### Implementation Tasks
- [ ] Create `vercel.json` configuration
- [ ] Update frontend to use `/api/` endpoints
- [ ] Remove client-exposed API keys
- [ ] Deploy to production
- [ ] Test complete user flows

**Environment Variables for Vercel:**
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Azure OpenAI (server-side only)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_GPT=gpt-4o-mini
AZURE_OPENAI_DEPLOYMENT_DALLE=dall-e-3

# Replicate (server-side only)
REPLICATE_API_TOKEN=your-replicate-token

# Resend (server-side only)
RESEND_API_KEY=re_your-api-key
EMAIL_FROM=Jigi <notifications@yourdomain.com>

# App
APP_URL=https://your-app.vercel.app
CRON_SECRET=your-secure-random-string
```

**Frontend API Client Update:**
```typescript
// src/lib/api.ts

const API_BASE = '/api'

export async function generateImage(params: {
  prompt: string
  campaign_id: string
  concept_id?: string
  brand_id?: string
  quality?: 'draft' | 'hd'
}) {
  const endpoint = params.quality === 'hd' 
    ? `${API_BASE}/generate/image-hd`
    : `${API_BASE}/generate/image`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${await getAuthToken()}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Generation failed')
  }

  return response.json()
}

// Similar updates for generateConcepts, generateCopy, etc.
```

---

## End-to-End Test Checklist

### Authentication Flow
- [ ] Sign up with email/password
- [ ] Receive confirmation email (if enabled)
- [ ] Sign in successfully
- [ ] Password reset works
- [ ] Session persists on refresh

### Brand Onboarding
- [ ] Create organisation
- [ ] Upload logo → colors extracted
- [ ] Complete onboarding wizard
- [ ] Brand profile saved to database

### Campaign & Generation
- [ ] Create new campaign (Brand-First)
- [ ] Create new campaign (Idea-First)
- [ ] Generate concepts → receive 4 concepts
- [ ] Generate copy → receive 5 variants
- [ ] Generate image (Flux) → image appears in ~2-4 seconds
- [ ] Generate image HD (DALL-E) → image appears in ~20-30 seconds
- [ ] All assets saved to database

### Review Workflow
- [ ] Submit asset for review
- [ ] Asset appears in review queue
- [ ] Approve asset → status changes
- [ ] Request changes → creator notified
- [ ] Reject asset → status changes

### Notifications
- [ ] Submission triggers email to reviewer
- [ ] Approval triggers email to creator
- [ ] In-app notifications appear in bell
- [ ] Mark notifications as read

### Dashboard
- [ ] Stats widget shows correct counts
- [ ] Pending reviews list accurate
- [ ] Recent campaigns displayed
- [ ] Approved assets accessible

---

## Technical Notes

### Security: API Key Management

**Before (INSECURE - exposed to client):**
```bash
VITE_AZURE_OPENAI_API_KEY=sk-xxx  # ❌ Bundled into JS
```

**After (SECURE - server-only):**
```bash
AZURE_OPENAI_API_KEY=sk-xxx  # ✓ Only accessible in /api/ routes
```

### Vercel Function Limits

| Tier | Duration | Memory | Concurrent |
|------|----------|--------|------------|
| Hobby | 10s | 1024MB | 10 |
| Pro | 60s | 3008MB | 100 |

**Note:** DALL-E 3 can take 15-30s. Hobby tier may timeout. Consider:
1. Use Flux Schnell as primary (1-4s)
2. Upgrade to Pro for HD images
3. Implement async generation with polling

### Replicate Billing

- No monthly fee
- Pay per prediction only
- Flux Schnell: ~$0.003/image
- First $5 free credit for new accounts

---

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/generate/concepts` | Generate campaign concepts | Bearer |
| POST | `/api/generate/copy` | Generate copy variants | Bearer |
| POST | `/api/generate/image` | Generate image (Flux) | Bearer |
| POST | `/api/generate/image-hd` | Generate image (DALL-E) | Bearer |
| POST | `/api/generate/compliance-check` | Check asset compliance | Bearer |
| POST | `/api/assets/[id]/submit` | Submit for review | Bearer |
| POST | `/api/assets/[id]/approve` | Approve asset | Bearer |
| POST | `/api/assets/[id]/reject` | Reject asset | Bearer |
| POST | `/api/assets/[id]/request-changes` | Request changes | Bearer |
| POST | `/api/assets/comments` | Add comment | Bearer |
| POST | `/api/cron/nudge` | Check & send nudges | Cron |

---

## Acceptance Criteria

- [ ] Supabase project created and all migrations applied
- [ ] Auth flow works end-to-end (signup, login, reset)
- [ ] Replicate Flux generates images successfully
- [ ] Azure GPT-4o-mini generates concepts and copy
- [ ] DALL-E 3 available as premium option
- [ ] All API calls go through `/api/` routes (no client-exposed keys)
- [ ] Email notifications sending via Resend
- [ ] Nudge cron job configured and working
- [ ] App deployed to Vercel production
- [ ] All major user flows tested and working

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Supabase migration failures | Run migrations one at a time, check for errors |
| Replicate rate limits | Implement exponential backoff, cache results |
| Vercel function timeouts | Use Flux Schnell (fast), consider Pro tier |
| Email deliverability | Start with sandbox mode, verify domain later |
| CORS issues | Configure proper headers in API routes |

---

## Dependencies for Sprint 10

Sprint 10 requires:
- All services provisioned and connected
- API routes deployed and functional
- End-to-end flows verified
- Production deployment stable

---

## User Action Checklist

Complete these before implementation:

1. **Supabase**
   - [ ] Create account at supabase.com
   - [ ] Create project named `jigi-mvp`
   - [ ] Note Project URL, Anon Key, Service Role Key

2. **Replicate**
   - [ ] Create account at replicate.com
   - [ ] Generate API token
   - [ ] Note API token

3. **Azure OpenAI**
   - [ ] Create Azure account (or use existing)
   - [ ] Create Azure OpenAI resource
   - [ ] Deploy `gpt-4o-mini` model
   - [ ] Deploy `dall-e-3` model (optional for HD)
   - [ ] Note endpoint and API key

4. **Resend**
   - [ ] Create account at resend.com
   - [ ] (Optional) Verify domain
   - [ ] Generate API key
   - [ ] Note API key

5. **Vercel**
   - [ ] Create account at vercel.com
   - [ ] Prepare to import from Git

---

*Sprint 09A of 10 — Integration Phase*
