# Jigi — Project Specification

**Version:** 1.0  
**Date:** February 27, 2026  
**Status:** Single Source of Truth for MVP Development

---

## Document Purpose

This document serves as the complete specification for Jigi, from vision through implementation. It is designed to be used directly with AI-assisted development tools (Cursor, Lovable, Claude Code) as the authoritative reference for building the product.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Market Context](#2-market-context)
3. [Product Definition](#3-product-definition)
4. [User Types & Journeys](#4-user-types--journeys)
5. [Feature Specification](#5-feature-specification)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [API Specification](#8-api-specification)
9. [AI Integration](#9-ai-integration)
10. [Onboarding Flow](#10-onboarding-flow)
11. [MVP Scope](#11-mvp-scope)
12. [3-Month Roadmap](#12-3-month-roadmap)
13. [1-Year Vision](#13-1-year-vision)
14. [UI Design System](#14-ui-design-system)
15. [Tech Stack & Cost Optimisation](#15-tech-stack--cost-optimisation)
16. [Project Structure](#16-project-structure)
17. [Implementation Checklist](#17-implementation-checklist)

---

## 1. Product Vision

### 1.1 Name & Origin

**Jigi** — Rooted in the Yoruba word for glass, sunglasses, or mirror. The name reflects the product's purpose: helping brands see their creative work clearly, through their own lens.

### 1.2 One-Liner

> Brand-grounded creative generation with approval built in — so agencies deliver faster and brands say yes sooner.

### 1.3 The Problem

Creative agencies and brands suffer from a broken handoff:

- **Agencies** generate creative that drifts off-brand, requiring multiple revision cycles
- **Brands** wait days or weeks to review work, creating bottlenecks
- **Feedback** is scattered across email, Slack, and calls — context gets lost
- **AI tools** exist but generate generic content that requires heavy brand adaptation

The gap isn't in AI quality or DAM depth — it's in the *speed of the brand-agency handoff*.

### 1.4 The Solution

Jigi makes brand constraints the *input* to creative generation, not an afterthought. When an agency generates creative through Jigi:

1. Brand colours, fonts, tone, and language rules are automatically applied
2. AI checks compliance before humans review
3. Approval happens in the same interface where generation occurred
4. Proactive nudging keeps reviews from stalling

Result: Creative that's on-brand from the start, approved in days instead of weeks.

### 1.5 Business Model

| Who | Role | Pays? |
|-----|------|-------|
| **Brands** | Maintain brand profile, review/approve creative | Yes |
| **Agencies** | Generate creative, submit for approval | No (enablement layer) |

Brands pay. Agencies become distribution partners — Jigi helps them win and retain clients.

### 1.6 Why Now

- 80% of agencies use AI, but only ~5% have moved beyond experimentation
- 35% of agencies cite "compromised creative quality" as their top AI concern
- Billable hours are dying; "MarTech-as-a-Service" is winning
- Approval workflows remain manual, scattered, slow

---

## 2. Market Context

### 2.1 Competitive Landscape

| Category | Players | Jigi's Position |
|----------|---------|-----------------|
| **AI Creative Generation** | Jasper, Canva Magic Studio, Adobe Firefly, AdCreative.ai | Not competing on generation quality — using AI as interchangeable backend |
| **Digital Asset Management** | Bynder, Brandfolder, Canto, Frontify | Lightweight DAM only — not competing for enterprise DAM budgets |
| **Approval/Feedback Tools** | Filestage, Ziflow, Frame.io, Planable | Approval is embedded, not bolted on — not a standalone tool |

### 2.2 The Gap Jigi Fills

No current product combines:
- Brand constraints as AI input (not post-generation cleanup)
- Generation and approval in one interface
- Proactive nudging that compresses review cycles
- Agency-as-channel distribution model

### 2.3 Wedge Market

**Initial focus:** Advertising creatives (social ads, display ads, campaign concepts)

**Why this wedge:**
- High volume, high velocity
- Clear brand guidelines typically exist
- Approval cycles are painful and measurable
- Easy to demonstrate before/after time savings

---

## 3. Product Definition

### 3.1 Core Value Propositions

| For Agencies | For Brands |
|--------------|------------|
| Generate on-brand creative faster | Creative arrives already aligned to brand |
| Reduce revision cycles | Review and approve in one place |
| Win more pitches (demonstrate speed) | Proactive nudges prevent bottlenecks |
| Retain clients (workflow stickiness) | Lightweight asset organisation |

### 3.2 Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BRAND FOUNDATION LAYER                      │
│  Brand profiles, constraints, tone rules, visual identity       │
│  (The intelligence that makes everything else work)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CREATIVE GENERATION LAYER                     │
│  AI-powered concept + visual generation                         │
│  (Model-agnostic: selects best backend per use case)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  APPROVAL & DELIVERY LAYER                      │
│  Review, annotation, smart routing, proactive nudging           │
│  Lightweight asset storage with version history                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 What Jigi Is NOT

- **Not a full DAM** — storage is lightweight, focused on approved assets and version history
- **Not an image generation company** — AI backends are interchangeable (Flux, DALL-E, etc.)
- **Not a general-purpose feedback tool** — approval is specific to brand-agency creative workflow
- **Not trying to replace human creativity** — AI handles first drafts and variations, humans add polish

---

## 4. User Types & Journeys

### 4.1 User Roles

| Role | Organisation | Permissions |
|------|--------------|-------------|
| **Brand Admin** | Brand | Full access, manage team, define approval workflow |
| **Brand Approver** | Brand | Review, approve/reject/request changes |
| **Brand Reviewer** | Brand | View and comment only |
| **Agency Admin** | Agency | Manage agency team, access connected brands |
| **Agency Creator** | Agency | Generate creative, submit for approval |

### 4.2 Journey: Agency Generates Campaign Creative

```
1. Agency Creator logs in
2. Selects Brand from connected brands list
3. Creates new Campaign: "Q3 Product Launch"
4. Fills brief:
   - Objective: Drive awareness
   - Audience: Existing customers, 25-40
   - Channels: Instagram, Facebook
5. Clicks "Generate Concepts"
6. System injects brand constraints into AI prompt
7. Receives 4 concept directions with:
   - Campaign theme/big idea
   - Headline variants
   - Visual direction description
8. Selects 2 concepts to develop further
9. Generates actual images for selected concepts
10. Refines copy, adjusts visuals
11. Submits for internal Agency review
12. Agency CD approves internally
13. Submits to Brand for approval
14. Brand receives notification
```

### 4.3 Journey: Brand Reviews & Approves

```
1. Brand Approver receives email: "New creative ready for review"
2. Opens Jigi, sees review queue
3. Clicks into "Q3 Product Launch" campaign
4. Sees AI compliance summary:
   "All brand guidelines passed ✓"
5. Reviews each asset:
   - Views creative
   - Sees concept rationale
   - Can pin comments on specific areas
6. For Asset 1: Approves ✓
7. For Asset 2: Requests changes
   - Pins comment: "Headline too aggressive"
   - Adds note: "Try something warmer"
8. Submits feedback
9. Agency notified immediately
10. Agency revises Asset 2
11. Brand Approver receives nudge: "Revised asset ready"
12. Reviews, approves
13. Asset moves to "Approved" in campaign workspace
```

### 4.4 Journey: Brand Onboards (Self-Service)

```
1. Brand signs up (email or Google OAuth)
2. Creates organisation
3. Guided onboarding:
   a. Upload logo → colours auto-extracted
   b. Select fonts
   c. Choose tone descriptors (3-5 words)
   d. Add language rules (optional)
   e. Paste sample copy (optional)
   f. Set up approval workflow (who approves)
   g. Connect agency (optional)
4. First generation demo:
   - Quick brief input
   - See brand-grounded creative generated
   - "This is what your agency will create"
5. Arrives at dashboard, ready to receive creative
```

---

## 5. Feature Specification

### 5.1 Brand Foundation (Layer 1)

#### 5.1.1 Brand Profile

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | Yes | Brand/company name |
| **Logo** | Yes | Primary logo file (PNG, SVG, JPG) |
| **Colour Palette** | Yes | Primary, secondary, accent colours (hex codes) |
| **Typography** | Yes | Heading font, body font |
| **Tone Descriptors** | Yes | 3-5 words describing brand voice |
| **Preferred Words** | No | Words/phrases the brand uses |
| **Avoided Words** | No | Words/phrases to never use |
| **Sample Copy** | No | 2-3 examples of approved copy |
| **Positioning** | No | Strategic positioning statement |
| **Competitor Context** | No | Key competitors to differentiate from |

#### 5.1.2 Brand Team Management

- Invite team members by email
- Assign roles: Admin, Approver, Reviewer
- Define approval routing (who sees what)
- Set backup approvers for escalation

#### 5.1.3 Agency Connection

- Brand invites agency by email
- Agency receives access to brand workspace
- Brand controls agency permissions
- Multiple agencies can connect to one brand

### 5.2 Creative Generation (Layer 2)

#### 5.2.1 Campaign Creation

| Field | Required | Description |
|-------|----------|-------------|
| **Campaign Name** | Yes | Internal reference name |
| **Objective** | Yes | What the campaign should achieve |
| **Target Audience** | Yes | Who the creative is for |
| **Channels/Formats** | Yes | Where the creative will appear |
| **Requirements** | No | Specific constraints or mandatories |

#### 5.2.2 Generation Types

| Type | Output | AI Backend |
|------|--------|------------|
| **Concepts** | 4 campaign directions with themes, headlines, visual directions | Text model (GPT-4o-mini) |
| **Copy Variants** | 5+ headline/body copy options | Text model (GPT-4o-mini) |
| **Images** | Visual assets matching brand style | Image model (DALL-E 3 / Flux) |
| **Format Adaptation** | Resize/reformat approved creative | Automated + AI assist |

#### 5.2.3 Brand Grounding

Before generation, system constructs prompt including:
- Brand colour constraints
- Typography guidance
- Tone descriptors
- Language rules (use/avoid)
- Sample copy for style matching
- Positioning context (if provided)

After generation, system runs compliance check:
- Colour adherence (for images)
- Tone alignment
- Language rule compliance
- Potential legal/compliance flags

#### 5.2.4 Model Selection Logic

```
IF task = "concepts" OR task = "copy"
    USE GPT-4o-mini (fast, cheap)
    
IF task = "image" AND quality = "draft"
    USE Flux Schnell (fastest, cheapest)
    
IF task = "image" AND quality = "production"
    USE DALL-E 3 (highest quality)
    
IF task = "compliance_check"
    USE GPT-4o-mini (classification task)
```

### 5.3 Approval & Delivery (Layer 3)

#### 5.3.1 Workflow States

```
Draft → Agency Review → Submitted → Brand Review → Approved
                                  → Changes Requested → Draft
                                  → Rejected
```

#### 5.3.2 Review Interface

- View creative asset (image + copy)
- See AI compliance check summary
- Pin comments on specific areas of image
- Threaded comment replies
- @mention team members
- Resolve/unresolve comments
- Approve / Request Changes / Reject actions

#### 5.3.3 Proactive Nudging System

| Trigger | Timing | Action |
|---------|--------|--------|
| Asset pending review | 24 hours | Email + in-app notification to reviewer |
| Asset still pending | 48 hours | Escalate to backup approver |
| Reviewer opened but didn't act | 4 hours | In-app nudge: "Ready to finish?" |
| Multiple assets pending same reviewer | — | Batch digest: "5 items waiting" |
| Deadline approaching | 24 hours before | Countdown notification |

#### 5.3.4 Lightweight Asset Storage

**Included:**
- Approved assets organised by campaign
- Version history with approval status
- Comments/feedback per version
- Approval audit trail

**Excluded (not building):**
- Advanced search/tagging
- Rights management
- Integrations with external DAMs
- Video storage/streaming

---

## 6. Technical Architecture

### 6.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                    React 19 + TypeScript                        │
│                    Vite + Tailwind CSS                          │
│                    Zustand (state)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE/SERVERLESS                     │
│                    API Routes (TypeScript)                      │
│                    AI Orchestration Layer                       │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    SUPABASE      │ │   AZURE AI       │ │    REPLICATE     │
│  PostgreSQL      │ │  GPT-4o-mini     │ │  Flux (backup)   │
│  Auth            │ │  DALL-E 3        │ │                  │
│  Storage         │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RESEND                                  │
│                   Transactional Email                           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | React 19 + TypeScript | Modern, well-supported, team familiarity |
| **Build Tool** | Vite | Fast development, optimised production builds |
| **Styling** | Tailwind CSS (local build) | Utility-first, purged for production |
| **State Management** | Zustand | Lightweight, simple, no boilerplate |
| **Routing** | React Router | Standard, flexible |
| **Backend** | Vercel Serverless | Zero infrastructure, scales automatically |
| **Database** | Supabase PostgreSQL | Free tier generous, RLS built-in, real-time ready |
| **Auth** | Supabase Auth | Integrated, supports OAuth |
| **File Storage** | Supabase Storage | Integrated, simple |
| **AI (Text)** | Azure OpenAI (GPT-4o-mini) | Uses existing Azure credits |
| **AI (Images)** | Azure DALL-E 3 / Replicate Flux | Azure credits, Flux as cheap fallback |
| **Email** | Resend | Generous free tier, simple API |

### 6.3 Security Model

| Layer | Protection |
|-------|------------|
| **API Keys** | All AI/external keys server-side only |
| **Client** | Only Supabase anon key exposed (safe with RLS) |
| **Auth** | JWT validation on every API request |
| **Database** | Row Level Security (RLS) for data isolation |
| **File Access** | Signed URLs for asset retrieval |

---

## 7. Data Model

### 7.1 Entity Relationship Diagram

```
organisations
├── id (PK)
├── name
├── type (brand | agency)
└── created_at
        │
        ├──────────────────┐
        │                  │
        ▼                  ▼
    brands              users
    ├── id (PK)         ├── id (PK)
    ├── org_id (FK)     ├── org_id (FK)
    ├── identity        ├── email
    ├── voice           ├── role
    └── governance      └── created_at
        │
        ├───────────────────────────────┐
        │                               │
        ▼                               ▼
    campaigns                   agency_brand_access
    ├── id (PK)                 ├── agency_org_id (FK)
    ├── brand_id (FK)           ├── brand_id (FK)
    ├── name                    └── permissions
    ├── brief
    └── status
        │
        ▼
    creative_assets
    ├── id (PK)
    ├── campaign_id (FK)
    ├── type
    ├── content
    ├── version
    ├── status
    └── compliance_check
        │
        ├───────────────────┐
        │                   │
        ▼                   ▼
    asset_comments      approval_actions
    ├── id (PK)         ├── id (PK)
    ├── asset_id (FK)   ├── asset_id (FK)
    ├── user_id (FK)    ├── user_id (FK)
    ├── content         ├── action
    └── position        └── notes
```

### 7.2 Table Definitions

```sql
-- Organisations (brands or agencies)
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('brand', 'agency')),
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (linked to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organisation_id UUID REFERENCES organisations(id),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'approver', 'reviewer', 'creator')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands (always belong to a brand-type organisation)
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id),
    name TEXT NOT NULL,
    
    -- Identity (JSONB)
    identity JSONB DEFAULT '{}',
    -- Structure: { colours: [], fonts: {}, logo_url: "" }
    
    -- Voice (JSONB)
    voice JSONB DEFAULT '{}',
    -- Structure: { tone: [], preferred_words: [], avoided_words: [], samples: [] }
    
    -- Strategy (optional, JSONB)
    strategy JSONB DEFAULT '{}',
    -- Structure: { positioning: "", differentiators: [], competitors: [] }
    
    -- Governance (JSONB)
    governance JSONB DEFAULT '{}',
    -- Structure: { approval_workflow: [], backup_approvers: [] }
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agency-Brand Access
CREATE TABLE agency_brand_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_organisation_id UUID REFERENCES organisations(id),
    brand_id UUID REFERENCES brands(id),
    permissions JSONB DEFAULT '{"can_generate": true, "can_view_approved": true}',
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    
    UNIQUE(agency_organisation_id, brand_id)
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    created_by UUID REFERENCES users(id),
    name TEXT NOT NULL,
    brief JSONB DEFAULT '{}',
    -- Structure: { objective: "", audience: "", channels: [], requirements: "" }
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creative Assets
CREATE TABLE creative_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    created_by UUID REFERENCES users(id),
    
    type TEXT NOT NULL CHECK (type IN ('concept', 'copy', 'image')),
    content JSONB NOT NULL,
    -- Structure varies by type:
    -- concept: { theme: "", headlines: [], visual_direction: "" }
    -- copy: { headlines: [], body: "", cta: "" }
    -- image: { url: "", prompt_used: "", model: "" }
    
    version INTEGER DEFAULT 1,
    parent_asset_id UUID REFERENCES creative_assets(id),
    
    status TEXT DEFAULT 'draft' CHECK (status IN (
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

-- Asset Comments
CREATE TABLE asset_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id),
    user_id UUID REFERENCES users(id),
    
    content TEXT NOT NULL,
    position JSONB,
    -- Structure: { x: 0.5, y: 0.3 } (relative coordinates for pin)
    
    parent_comment_id UUID REFERENCES asset_comments(id),
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval Actions
CREATE TABLE approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id),
    user_id UUID REFERENCES users(id),
    
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idea Bank (brand-contributed ideas)
CREATE TABLE idea_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    submitted_by UUID REFERENCES users(id),
    
    title TEXT NOT NULL,
    description TEXT,
    references JSONB DEFAULT '[]',
    -- Structure: [{ type: "image", url: "" }, { type: "link", url: "" }]
    
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'declined', 'used')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    type TEXT NOT NULL,
    -- Types: review_needed, changes_requested, asset_approved, nudge_reminder, etc.
    
    title TEXT NOT NULL,
    body TEXT,
    
    related_asset_id UUID REFERENCES creative_assets(id),
    related_campaign_id UUID REFERENCES campaigns(id),
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation Log (for analytics and debugging)
CREATE TABLE generation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    brand_id UUID REFERENCES brands(id),
    
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_hash TEXT,
    
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    latency_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Row Level Security Policies

```sql
-- Users can only see their own organisation's data
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organisation"
ON organisations FOR SELECT
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

-- Brand access controlled by organisation + agency access
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brand org members can access"
ON brands FOR ALL
USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    OR
    id IN (
        SELECT brand_id FROM agency_brand_access 
        WHERE agency_organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
    )
);

-- Similar policies for campaigns, assets, comments...
```

---

## 8. API Specification

### 8.1 API Structure

```
/api
├── /auth
│   ├── POST /signup              # Create account
│   ├── POST /login               # Email/password login
│   └── POST /invite              # Invite user to organisation
│
├── /organisations
│   ├── GET /                     # Get current user's organisation
│   └── PUT /                     # Update organisation
│
├── /brands
│   ├── GET /                     # List brands (filtered by access)
│   ├── POST /                    # Create new brand
│   ├── GET /:id                  # Get brand details
│   ├── PUT /:id                  # Update brand profile
│   ├── POST /:id/onboarding      # Complete onboarding step
│   ├── POST /:id/invite-agency   # Invite agency to brand
│   └── GET /:id/team             # List brand team members
│
├── /campaigns
│   ├── GET /                     # List campaigns (filtered by brand)
│   ├── POST /                    # Create campaign
│   ├── GET /:id                  # Get campaign with assets
│   └── PUT /:id                  # Update campaign
│
├── /generate
│   ├── POST /concepts            # Generate campaign concepts
│   ├── POST /copy                # Generate copy variants
│   ├── POST /image               # Generate image
│   └── POST /compliance-check    # Check asset compliance
│
├── /assets
│   ├── GET /                     # List assets (filtered by campaign)
│   ├── POST /                    # Create asset
│   ├── GET /:id                  # Get asset with comments
│   ├── PUT /:id                  # Update asset content
│   ├── POST /:id/submit          # Submit for review
│   ├── POST /:id/approve         # Approve asset
│   ├── POST /:id/reject          # Reject asset
│   └── POST /:id/request-changes # Request changes
│
├── /comments
│   ├── GET /                     # List comments (filtered by asset)
│   ├── POST /                    # Add comment
│   └── PUT /:id/resolve          # Resolve comment
│
├── /ideas
│   ├── GET /                     # List ideas (filtered by brand)
│   ├── POST /                    # Submit idea
│   └── PUT /:id                  # Update idea status
│
└── /notifications
    ├── GET /                     # Get user notifications
    └── PUT /:id/read             # Mark as read
```

### 8.2 Key Endpoint Details

#### POST /api/generate/concepts

**Request:**
```json
{
  "brand_id": "uuid",
  "campaign_id": "uuid",
  "brief": {
    "objective": "Drive awareness for summer collection",
    "audience": "Existing customers, 25-40",
    "channels": ["instagram_post", "facebook_ad"],
    "requirements": "Must include new product imagery"
  }
}
```

**Response:**
```json
{
  "concepts": [
    {
      "id": "temp-1",
      "theme": "Summer State of Mind",
      "headlines": [
        "Your summer just got an upgrade",
        "Made for moments that matter"
      ],
      "visual_direction": "Warm, golden-hour lighting. Lifestyle shots showing product in use. Soft focus backgrounds with vibrant accent colours.",
      "rationale": "Connects emotional benefit with product quality"
    }
  ],
  "compliance": {
    "passed": true,
    "checks": [
      { "name": "tone_alignment", "status": "pass", "message": "Matches brand tone: confident, warm" },
      { "name": "language_rules", "status": "pass", "message": "No avoided words used" }
    ]
  },
  "generation_id": "uuid"
}
```

#### POST /api/assets/:id/submit

**Request:**
```json
{
  "target": "brand_review",
  "message": "Ready for your review - incorporated feedback from last round"
}
```

**Response:**
```json
{
  "asset": {
    "id": "uuid",
    "status": "brand_review",
    "submitted_at": "2026-02-27T10:00:00Z"
  },
  "notifications_sent": ["user-uuid-1", "user-uuid-2"]
}
```

---

## 9. AI Integration

### 9.1 AI Orchestrator

The AI Orchestrator is the central service that:
1. Selects the appropriate model for each task
2. Builds brand-grounded prompts
3. Runs compliance checks
4. Handles fallbacks if primary model fails

```typescript
// Location: packages/api/lib/ai/orchestrator.ts

interface GenerationRequest {
  type: 'concept' | 'copy' | 'image';
  brand: BrandConstraints;
  brief: CampaignBrief;
  options?: {
    quality?: 'draft' | 'production';
    model_override?: string;
  };
}

interface BrandConstraints {
  identity: {
    colours: Array<{ hex: string; role: string }>;
    fonts: { heading: string; body: string };
  };
  voice: {
    tone: string[];
    preferred_words: string[];
    avoided_words: string[];
    samples: string[];
  };
  strategy?: {
    positioning: string;
    differentiators: string[];
  };
}

class AIOrchestrator {
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const model = this.selectModel(request);
    const prompt = this.buildPrompt(request);
    
    const result = await model.generate(prompt);
    const compliance = await this.checkCompliance(result, request.brand);
    
    return { content: result, compliance };
  }
  
  private selectModel(request: GenerationRequest): AIModel {
    if (request.type === 'image') {
      // Use Azure DALL-E while credits last, fallback to Replicate Flux
      if (request.options?.quality === 'draft') {
        return new ReplicateFluxSchnell();
      }
      return new AzureDALLE3();
    }
    
    // Text generation always uses GPT-4o-mini (fast + cheap)
    return new AzureGPT4oMini();
  }
  
  private buildPrompt(request: GenerationRequest): string {
    // See Section 9.2 for prompt templates
  }
}
```

### 9.2 Prompt Templates

#### Concept Generation Prompt

```
You are a senior creative strategist generating advertising campaign concepts.

BRAND CONSTRAINTS (follow exactly):
- Brand name: {{brand.name}}
- Colours: {{brand.identity.colours | json}}
- Tone of voice: {{brand.voice.tone | join(", ")}}
- Language to use: {{brand.voice.preferred_words | join(", ")}}
- Language to avoid: {{brand.voice.avoided_words | join(", ")}}
{{#if brand.strategy}}
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

Format as JSON array.
```

#### Compliance Check Prompt

```
You are a brand compliance checker. Review the following creative content against brand guidelines.

CONTENT TO CHECK:
{{content | json}}

BRAND GUIDELINES:
- Required tone: {{brand.voice.tone | join(", ")}}
- Preferred words: {{brand.voice.preferred_words | join(", ")}}
- Avoided words: {{brand.voice.avoided_words | join(", ")}}
- Brand colours: {{brand.identity.colours | json}}

CHECK FOR:
1. Tone alignment - does the content match the required tone?
2. Language compliance - are preferred words used? Are avoided words present?
3. Potential legal issues - any claims that might need legal review?

Return JSON:
{
  "passed": boolean,
  "checks": [
    { "name": "tone_alignment", "status": "pass|warn|fail", "message": "..." },
    { "name": "language_compliance", "status": "pass|warn|fail", "message": "..." },
    { "name": "legal_flags", "status": "pass|warn|fail", "message": "..." }
  ]
}
```

### 9.3 Model Adapter Pattern

```typescript
// Base interface for all AI models
interface AIModel {
  generate(prompt: string): Promise<string>;
  name: string;
  costPer1kTokens: number;
}

// Azure OpenAI adapter
class AzureGPT4oMini implements AIModel {
  name = 'gpt-4o-mini';
  costPer1kTokens = 0.00015;
  
  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${AZURE_ENDPOINT}/openai/deployments/gpt-4o-mini/chat/completions`, {
      method: 'POST',
      headers: {
        'api-key': AZURE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

// Replicate Flux adapter (fallback for images)
class ReplicateFluxSchnell implements AIModel {
  name = 'flux-schnell';
  costPer1kTokens = 0; // Priced per image
  costPerImage = 0.003;
  
  async generate(prompt: string): Promise<string> {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'black-forest-labs/flux-schnell',
        input: { prompt }
      })
    });
    
    const prediction = await response.json();
    // Poll for completion...
    return prediction.output[0]; // Image URL
  }
}
```

---

## 10. Onboarding Flow

### 10.1 Flow Summary

| Step | Time | What Happens |
|------|------|--------------|
| 1. Account Setup | 2 min | Create account, basic org details |
| 2. Brand Identity | 5 min | Logo upload, colour extraction, fonts |
| 3. Brand Voice | 5 min | Tone selection, language rules, samples |
| 4. Approval Setup | 3 min | Define who approves, invite team |
| 5. Agency Connection | 2 min | Connect existing agency (optional) |
| 6. First Generation | 5 min | Demo generation showing brand-grounding |

**Total: ~20 minutes to first value**

### 10.2 Step-by-Step Screens

#### Step 1: Account Creation

```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome to Jigi                                                │
│                                                                 │
│  Let's set up your brand workspace. (~15 minutes)               │
│                                                                 │
│  [Work email                                                ]   │
│  [Password                                                  ]   │
│  [Your name                                                 ]   │
│                                                                 │
│  [ Continue with Google ]                                       │
│                                                                 │
│              [ Create Account ]                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2a: Logo Upload

```
┌─────────────────────────────────────────────────────────────────┐
│  Upload your logo                                               │
│                                                                 │
│  We'll extract your brand colours automatically.                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │           [ Drag logo here or click to upload ]           │ │
│  │                                                           │ │
│  │           PNG, SVG, or JPG                                │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [ Skip for now ]                              [ Continue ]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2b: Colour Extraction (after upload)

```
┌─────────────────────────────────────────────────────────────────┐
│  We found these colours                                         │
│                                                                 │
│  [LOGO PREVIEW]                                                 │
│                                                                 │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐                               │
│  │████│  │████│  │████│  │████│                               │
│  └────┘  └────┘  └────┘  └────┘                               │
│  #1A1A2E  #E94560  #FFFFFF  #0F3460                            │
│  Primary  Accent   Light    Dark                                │
│                                                                 │
│  [ Edit colours ]   [ + Add colour ]                            │
│                                                                 │
│                                            [ Continue ]         │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2c: Typography

```
┌─────────────────────────────────────────────────────────────────┐
│  Select your brand fonts                                        │
│                                                                 │
│  Headings                                                       │
│  [ Search Google Fonts...                                   ]   │
│                                                                 │
│  Popular: [ Inter ] [ Poppins ] [ Montserrat ] [ Playfair ]    │
│                                                                 │
│  Body text                                                      │
│  [ Search Google Fonts...                                   ]   │
│                                                                 │
│  [ ] Use same font for both                                     │
│                                                                 │
│  Or upload your fonts: [ Upload .woff/.ttf ]                    │
│                                                                 │
│                                            [ Continue ]         │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3a: Tone Selection

```
┌─────────────────────────────────────────────────────────────────┐
│  How does your brand sound?                                     │
│                                                                 │
│  Select 3-5 words that describe your brand's tone:              │
│                                                                 │
│  [ Friendly    ] [ Professional ] [ Playful    ] [ Bold      ] │
│  [ Warm        ] [ Confident    ] [ Minimal    ] [ Luxurious  ] │
│  [ Witty       ] [ Authoritative] [ Caring     ] [ Edgy       ] │
│  [ Innovative  ] [ Trustworthy  ] [ Casual     ] [ Sophisticated] │
│                                                                 │
│  Selected: Professional, Confident, Warm ✓                      │
│                                                                 │
│                                            [ Continue ]         │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3b: Language Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  Any language rules we should know?                             │
│                                                                 │
│  Words your brand uses:                                         │
│  [ e.g., "partners" not "customers"                         ]   │
│  [ + Add another ]                                              │
│                                                                 │
│  Words to avoid:                                                │
│  [ e.g., "cheap", "basic", competitor names                 ]   │
│  [ + Add another ]                                              │
│                                                                 │
│  [ Skip for now ]                              [ Continue ]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3c: Sample Copy (Optional)

```
┌─────────────────────────────────────────────────────────────────┐
│  Show us your brand voice in action                             │
│                                                                 │
│  Paste 2-3 examples of copy you love. We'll learn your style.   │
│                                                                 │
│  Example 1:                                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [                                                       ] │ │
│  │ [                                                       ] │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Source: [ Website headline                               ]     │
│                                                                 │
│  [ + Add another example ]                                      │
│                                                                 │
│  Or upload brand guidelines: [ Upload PDF ]                     │
│                                                                 │
│  [ Skip for now ]                              [ Continue ]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 4: Approval Setup

```
┌─────────────────────────────────────────────────────────────────┐
│  Who approves creative work?                                    │
│                                                                 │
│  Fewer approvers = faster turnaround                            │
│                                                                 │
│  Primary approver (you):                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 👤 [Your Name]                                            │ │
│  │    your.email@company.com                                 │ │
│  │    Role: Brand Admin                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Add team members:                                              │
│  Email: [                                                   ]   │
│  Role:  ( ) Reviewer  ( ) Approver                              │
│  [ + Add person ]                                               │
│                                                                 │
│  [ Skip for now ]                              [ Continue ]     │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 5: Agency Connection

```
┌─────────────────────────────────────────────────────────────────┐
│  Work with a creative agency?                                   │
│                                                                 │
│  Connect your agency so they can generate brand-grounded        │
│  creative on your behalf.                                       │
│                                                                 │
│  ( ) Yes, connect my agency                                     │
│      Agency email: [                                        ]   │
│                                                                 │
│  ( ) Not right now                                              │
│                                                                 │
│  Your agency will receive an invitation with controlled         │
│  access to your brand workspace.                                │
│                                                                 │
│                                            [ Continue ]         │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 6: First Generation

```
┌─────────────────────────────────────────────────────────────────┐
│  Let's see Jigi in action                                       │
│                                                                 │
│  Your brand:                                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [LOGO]  Acme Corp                                         │ │
│  │ ████ ████ ████  •  Professional, Confident, Warm          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Quick brief - what do you want to promote?                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [ e.g., "Our new summer collection"                     ] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Format: [ Instagram Post ▼ ]                                   │
│                                                                 │
│              [ Generate Sample ]                                │
│                                                                 │
│  [ Skip and go to dashboard ]                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 6b: Generation Result

```
┌─────────────────────────────────────────────────────────────────┐
│  Here's what we created for Acme Corp                           │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │                 │  │ Headline:                           │  │
│  │ [GENERATED      │  │ "Summer just got better."           │  │
│  │  IMAGE]         │  │                                     │  │
│  │                 │  │ Body:                               │  │
│  │ Using your      │  │ "Discover our new collection —      │  │
│  │ brand colours   │  │  designed for the moments that      │  │
│  │                 │  │  matter."                           │  │
│  │                 │  │                                     │  │
│  │                 │  │ CTA: "Shop Now"                     │  │
│  └─────────────────┘  └─────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ✓ Brand colours applied                                   │ │
│  │ ✓ Tone: Professional, Confident, Warm                     │ │
│  │ ✓ No avoided words used                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  This is what your agency will create for you.                  │
│                                                                 │
│              [ Go to Dashboard ]                                │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 Onboarding Data Captured

```json
{
  "organisation": {
    "name": "Acme Corp",
    "type": "brand",
    "industry": "Retail"
  },
  "brand": {
    "identity": {
      "logo_url": "https://storage.../acme-logo.png",
      "colours": [
        { "hex": "#1A1A2E", "role": "primary" },
        { "hex": "#E94560", "role": "accent" },
        { "hex": "#FFFFFF", "role": "light" }
      ],
      "fonts": {
        "heading": "Montserrat",
        "body": "Inter"
      }
    },
    "voice": {
      "tone": ["Professional", "Confident", "Warm"],
      "preferred_words": ["partners", "solutions"],
      "avoided_words": ["cheap", "basic"],
      "samples": ["Summer just got better..."]
    }
  },
  "team": [
    { "email": "marketing@acme.com", "role": "admin" },
    { "email": "creative@acme.com", "role": "approver" }
  ],
  "agency_connection": {
    "agency_email": "hello@creative-agency.com"
  }
}
```

---

## 11. MVP Scope

### 11.1 MVP Definition

**Goal:** Demonstrate the core value proposition with a single agency and 2-3 brand clients.

**Timeline:** 8-10 weeks

**Success Criteria:**
- Agency can generate brand-grounded creative for connected brands
- Brands can review and approve/reject in the platform
- Time from submission to approval measurably reduced
- At least one brand says "I'd pay for this"

### 11.2 MVP Feature Set

#### ✅ In MVP

| Feature | Priority | Notes |
|---------|----------|-------|
| **Auth & Accounts** | P0 | Email/password, Google OAuth |
| **Organisation setup** | P0 | Brand or Agency type |
| **Brand profile creation** | P0 | Identity + Voice (minimum) |
| **Brand onboarding wizard** | P0 | Steps 1-4 (simplified) |
| **Agency-brand connection** | P0 | Invite by email |
| **Campaign creation** | P0 | Name, brief fields |
| **Concept generation** | P0 | Text-based, brand-grounded |
| **Copy generation** | P0 | Headline + body variants |
| **Image generation** | P0 | Single model (DALL-E 3) |
| **Compliance check** | P1 | Basic tone + language check |
| **Asset submission workflow** | P0 | Draft → Submitted → Review |
| **Review interface** | P0 | View asset, basic comments |
| **Approve/Reject actions** | P0 | Simple actions with notes |
| **Email notifications** | P0 | Submission, approval, rejection |
| **Basic nudging** | P1 | 24hr reminder email |
| **Dashboard** | P0 | List campaigns, pending reviews |
| **Approved assets view** | P1 | Simple list with versions |

#### ❌ NOT in MVP

| Feature | Reason | When |
|---------|--------|------|
| Pin comments on images | Complexity | 3-month |
| Threaded comment replies | Complexity | 3-month |
| Advanced nudging (escalation) | Nice-to-have | 3-month |
| Idea bank | Not core value | 3-month |
| Multiple AI models | Premature | 3-month |
| Format adaptation | Out of scope | 6-month |
| Analytics/reporting | Post-validation | 6-month |
| Slack integration | Post-validation | 6-month |
| Mobile apps | Post-validation | 1-year |

### 11.3 MVP Technical Scope

```
✅ Build:
├── React app with routing (5-6 views)
├── Supabase auth + database
├── 10-12 API endpoints
├── Azure OpenAI integration (GPT-4o-mini + DALL-E)
├── Basic email notifications (Resend)
└── Vercel deployment

❌ Don't build:
├── Real-time features (use polling)
├── Complex state management (Zustand basics only)
├── Image editing/manipulation
├── File format conversions
├── Background job queue (sync generation OK for MVP)
└── Admin dashboard
```

### 11.4 MVP Development Phases

#### Phase 1: Foundation (Weeks 1-3)

**Week 1: Project Setup**
- [ ] Create repo with project structure
- [ ] Set up Supabase project
- [ ] Create database migrations (organisations, users, brands)
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Basic React app with routing

**Week 2: Auth & Organisations**
- [ ] Supabase Auth integration
- [ ] Sign up / sign in flows
- [ ] Organisation creation
- [ ] User profile
- [ ] RLS policies

**Week 3: Brand Foundation**
- [ ] Brand profile CRUD
- [ ] Brand onboarding wizard (Steps 1-4)
- [ ] Colour extraction from logo (basic)
- [ ] Agency-brand connection

#### Phase 2: Generation (Weeks 4-6)

**Week 4: Campaign & AI Setup**
- [ ] Campaign CRUD
- [ ] Azure OpenAI integration
- [ ] AI Orchestrator scaffolding
- [ ] Prompt templates

**Week 5: Creative Generation**
- [ ] Concept generation endpoint
- [ ] Copy generation endpoint
- [ ] Generation UI in campaign view
- [ ] Save generated assets

**Week 6: Image Generation + Compliance**
- [ ] Image generation endpoint (DALL-E 3)
- [ ] Image display and storage
- [ ] Compliance check endpoint
- [ ] Compliance display in UI

#### Phase 3: Approval (Weeks 7-9)

**Week 7: Submission Workflow**
- [ ] Asset status management
- [ ] Submit for review action
- [ ] Review queue view
- [ ] Basic review interface

**Week 8: Approval Actions + Notifications**
- [ ] Approve/Reject/Request Changes actions
- [ ] Basic commenting (no pin)
- [ ] Resend integration
- [ ] Email notifications

**Week 9: Polish & Nudging**
- [ ] 24hr nudge emails
- [ ] Approved assets view
- [ ] Dashboard improvements
- [ ] Bug fixes and polish

#### Phase 4: Testing (Week 10)

- [ ] Internal testing with agency team
- [ ] Onboard first real brand
- [ ] Gather feedback
- [ ] Critical bug fixes
- [ ] Documentation

---

## 12. 3-Month Roadmap

### 12.1 Month 1: MVP Launch + Iteration

**Goals:**
- Launch MVP to 3-5 brands
- Gather feedback on core workflow
- Fix critical issues

**Features to add:**
- Pin comments on images
- Threaded comment replies
- Version comparison view

### 12.2 Month 2: Approval Depth

**Goals:**
- Reduce approval time by 50%
- Improve reviewer experience

**Features to add:**
- Advanced nudging (escalation, batch digest)
- Backup approver routing
- Approval analytics (time-to-approve metrics)
- Keyboard shortcuts for reviewers
- Mobile-responsive review interface

### 12.3 Month 3: Generation Expansion

**Goals:**
- Support more creative formats
- Improve generation quality

**Features to add:**
- Multiple AI models (Flux as fallback)
- Model quality selector (draft vs production)
- Remix/variation generation
- Idea bank (brand-contributed ideas)
- Campaign templates

### 12.4 3-Month Success Metrics

| Metric | Target |
|--------|--------|
| Active brands | 10+ |
| Active agency users | 25+ |
| Campaigns created | 50+ |
| Avg. time to first approval | < 48 hours |
| Avg. revision rounds | < 2 |
| NPS from brands | > 40 |

---

## 13. 1-Year Vision

### 13.1 6-Month Milestones

**Q1 (Months 1-3): Foundation**
- MVP launched and validated
- Core workflow proven with 10+ brands
- First paying customers

**Q2 (Months 4-6): Scale**
- Self-serve onboarding
- 50+ brands
- Integrations (Slack, Google Drive)
- Format adaptation (resize, reformat)
- Basic analytics dashboard

### 13.2 12-Month Milestones

**Q3 (Months 7-9): Platform**
- Agency white-labelling
- Multi-brand campaigns
- Advanced DAM features (search, tagging)
- API access for brands
- Video creative support (basic)

**Q4 (Months 10-12): Intelligence**
- AI-powered approval routing
- Performance prediction ("this will get rejected because...")
- Historical pattern learning
- Brand voice fine-tuning
- Campaign performance tracking

### 13.3 1-Year Feature Roadmap

| Feature | Timeline | Impact |
|---------|----------|--------|
| **Slack integration** | Month 4 | Notifications in workflow |
| **Google Drive export** | Month 4 | Asset delivery |
| **Format adaptation** | Month 5 | Multi-channel from one creative |
| **Analytics dashboard** | Month 5 | Prove ROI |
| **Agency white-label** | Month 6 | Distribution play |
| **Advanced search** | Month 7 | DAM functionality |
| **API access** | Month 7 | Integration with brand tools |
| **Video creative** | Month 8 | Format expansion |
| **AI routing** | Month 9 | Smart approval |
| **Performance prediction** | Month 10 | Pre-review intelligence |
| **Voice fine-tuning** | Month 11 | Better generation quality |
| **Mobile apps** | Month 12 | Approve on the go |

### 13.4 1-Year Business Targets

| Metric | Target |
|--------|--------|
| Monthly Recurring Revenue (MRR) | £50K |
| Active brands | 200+ |
| Active agencies | 30+ |
| Team size | 5-8 |
| Gross margin | > 70% |

### 13.5 Pricing Vision (Future)

| Tier | Price | Includes |
|------|-------|----------|
| **Starter** | £99/month | 1 brand, 3 users, 50 generations |
| **Professional** | £299/month | 3 brands, 10 users, 200 generations |
| **Business** | £599/month | 10 brands, 25 users, unlimited generations |
| **Enterprise** | Custom | Unlimited, API access, white-label, SLA |

*Note: Agencies don't pay directly; brands pay and connect agencies.*

---

## 14. UI Design System

### 14.1 Design Principles

1. **Polished whilst slightly muted** — Professional, refined, never loud
2. **Content is hero** — UI recedes, brand assets take focus
3. **Warm neutrals** — Not clinical, approachable
4. **Teal accent** — Creative confidence without shouting

### 14.2 Colour Palette

```css
:root {
  /* ============================================
     JIGI DESIGN SYSTEM
     Polished whilst slightly muted
     ============================================ */

  /* Base */
  --color-bg: #FEFDFB;              /* Warm off-white */
  --color-bg-subtle: #F9F8F6;       /* Slightly darker for sections */
  --color-surface: #FFFFFF;          /* Cards, inputs */
  --color-surface-raised: #FFFFFF;   /* Modals, dropdowns */
  
  /* Borders */
  --color-border: #E8E6E3;           /* Warm grey border */
  --color-border-subtle: #F0EEEB;    /* Very subtle dividers */
  --color-border-strong: #D4D1CC;    /* Emphasized borders */
  
  /* Text */
  --color-text-primary: #1C1917;     /* Near-black, warm */
  --color-text-secondary: #78716C;   /* Muted for secondary info */
  --color-text-muted: #A8A29E;       /* Placeholders, disabled */
  --color-text-inverse: #FFFFFF;     /* On dark backgrounds */
  
  /* Accent - Teal */
  --color-accent: #0D9488;           /* Primary teal */
  --color-accent-hover: #0F766E;     /* Darker on hover */
  --color-accent-subtle: #CCFBF1;    /* Light teal background */
  --color-accent-muted: #5EEAD4;     /* For borders, icons on light */
  
  /* Status */
  --color-success: #059669;          /* Approvals - green */
  --color-success-subtle: #D1FAE5;   /* Success background */
  --color-warning: #D97706;          /* Pending, nudges - amber */
  --color-warning-subtle: #FEF3C7;   /* Warning background */
  --color-error: #DC2626;            /* Rejections - red */
  --color-error-subtle: #FEE2E2;     /* Error background */
  --color-info: #0284C7;             /* Informational - blue */
  --color-info-subtle: #E0F2FE;      /* Info background */
  
  /* Interactive States */
  --color-hover: #F5F4F2;            /* Hover on interactive elements */
  --color-active: #EDEBE8;           /* Active/pressed state */
  --color-focus-ring: #0D9488;       /* Focus outline colour */
  
  /* Shadows - Subtle, warm */
  --shadow-xs: 0 1px 2px rgba(28, 25, 23, 0.04);
  --shadow-sm: 0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04);
  --shadow-md: 0 4px 6px rgba(28, 25, 23, 0.06), 0 2px 4px rgba(28, 25, 23, 0.04);
  --shadow-lg: 0 10px 15px rgba(28, 25, 23, 0.08), 0 4px 6px rgba(28, 25, 23, 0.04);
  --shadow-xl: 0 20px 25px rgba(28, 25, 23, 0.10), 0 10px 10px rgba(28, 25, 23, 0.04);
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* Typography */
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 15px;
  --text-lg: 16px;
  --text-xl: 18px;
  --text-2xl: 20px;
  --text-3xl: 24px;
  --text-4xl: 32px;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
  --transition-slow: 250ms ease;
  
  /* Z-Index Scale */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-toast: 500;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-bg: #0C0A09;
  --color-bg-subtle: #1C1917;
  --color-surface: #1C1917;
  --color-surface-raised: #292524;
  
  --color-border: #292524;
  --color-border-subtle: #1C1917;
  --color-border-strong: #44403C;
  
  --color-text-primary: #FAFAF9;
  --color-text-secondary: #A8A29E;
  --color-text-muted: #78716C;
  
  --color-accent: #2DD4BF;
  --color-accent-hover: #5EEAD4;
  --color-accent-subtle: #042F2E;
  --color-accent-muted: #0F766E;
  
  --color-hover: #292524;
  --color-active: #44403C;
  
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
}
```

### 14.3 Typography

**Font:** Plus Jakarta Sans (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
```

| Style | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| Display | 32px | 700 | 1.25 | Page titles |
| Heading 1 | 24px | 600 | 1.25 | Section headers |
| Heading 2 | 20px | 600 | 1.375 | Card titles |
| Heading 3 | 16px | 600 | 1.375 | Subsections |
| Heading 4 | 14px | 600 | 1.375 | Small headings |
| Body | 14px | 400 | 1.5 | Default text |
| Body Small | 13px | 400 | 1.5 | Secondary info |
| Label | 13px | 500 | 1.25 | Form labels |
| Caption | 12px | 500 | 1.5 | Metadata, timestamps |
| Overline | 12px | 600 | 1.25 | Section labels (uppercase) |

### 14.4 Component Specifications

#### Buttons

| Type | Background | Text | Border | Use |
|------|------------|------|--------|-----|
| Primary | `#0D9488` (teal) | White | None | Main actions |
| Secondary | White | `#1C1917` | `#E8E6E3` | Secondary actions |
| Ghost | Transparent | `#78716C` | None | Tertiary actions |
| Danger | `#DC2626` | White | None | Destructive actions |
| Approve | `#059669` | White | None | Approval action |
| Request Changes | `#D97706` | White | None | Changes action |

**Button Sizing:**

| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 6px 12px | 13px |
| Default | 10px 16px | 14px |
| Large | 12px 20px | 15px |

#### Inputs

```
Background: #FFFFFF
Border: 1px solid #E8E6E3
Border Radius: 8px
Padding: 10px 14px
Focus Ring: 3px #CCFBF1 + border #0D9488
Error: Border #DC2626, ring #FEE2E2
```

#### Cards

```
Background: #FFFFFF
Border: 1px solid #E8E6E3
Border Radius: 12px
Shadow: 0 1px 2px rgba(28, 25, 23, 0.04)
Padding: 24px (default), 16px (compact)
Hover (interactive): shadow increases, border darkens
```

#### Status Badges

| Status | Background | Text |
|--------|------------|------|
| Draft | `#F9F8F6` | `#78716C` |
| Pending Review | `#FEF3C7` | `#D97706` |
| In Review | `#E0F2FE` | `#0284C7` |
| Approved | `#D1FAE5` | `#059669` |
| Rejected | `#FEE2E2` | `#DC2626` |
| Changes Requested | `#FEF3C7` | `#D97706` |

### 14.5 Layout Specifications

#### Sidebar Navigation

```
Width: 240px (desktop)
Background: #F9F8F6
Border: 1px solid #F0EEEB (right)

Nav Item:
  Padding: 10px 12px
  Border Radius: 8px
  Icon: 20px
  
Active Item:
  Background: #CCFBF1
  Color: #0D9488
```

#### Page Layout

```
Page Header:
  Padding: 24px 32px
  Border: 1px solid #F0EEEB (bottom)
  Background: #FFFFFF

Page Body:
  Padding: 32px
  Background: #FEFDFB

Content Container:
  Max Width: 1200px (default)
  Max Width: 800px (narrow)
```

#### Review Interface

```
Layout: CSS Grid
  Asset Viewer: 1fr (left)
  Comments Panel: 380px (right)

Asset Viewer:
  Background: #F9F8F6
  Padding: 32px

Asset Frame:
  Background: #FFFFFF
  Border Radius: 12px
  Shadow: var(--shadow-lg)

Comments Panel:
  Background: #FFFFFF
  Border: 1px solid #E8E6E3 (left)
```

### 14.6 Tailwind Configuration

```javascript
// tailwind.config.js

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FEFDFB',
          subtle: '#F9F8F6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          raised: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E8E6E3',
          subtle: '#F0EEEB',
          strong: '#D4D1CC',
        },
        text: {
          primary: '#1C1917',
          secondary: '#78716C',
          muted: '#A8A29E',
          inverse: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          subtle: '#CCFBF1',
          muted: '#5EEAD4',
        },
        success: {
          DEFAULT: '#059669',
          subtle: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#D97706',
          subtle: '#FEF3C7',
        },
        error: {
          DEFAULT: '#DC2626',
          subtle: '#FEE2E2',
        },
        info: {
          DEFAULT: '#0284C7',
          subtle: '#E0F2FE',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        md: ['15px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '26px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['32px', { lineHeight: '40px' }],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(28, 25, 23, 0.04)',
        sm: '0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)',
        md: '0 4px 6px rgba(28, 25, 23, 0.06), 0 2px 4px rgba(28, 25, 23, 0.04)',
        lg: '0 10px 15px rgba(28, 25, 23, 0.08), 0 4px 6px rgba(28, 25, 23, 0.04)',
        xl: '0 20px 25px rgba(28, 25, 23, 0.10), 0 10px 10px rgba(28, 25, 23, 0.04)',
      },
    },
  },
  plugins: [],
};
```

### 14.7 Design Summary

| Aspect | Choice |
|--------|--------|
| **Mode** | Light default, dark mode available |
| **Background** | Warm off-white (#FEFDFB) |
| **Accent** | Teal (#0D9488) |
| **Typography** | Plus Jakarta Sans |
| **Vibe** | Polished whilst slightly muted |
| **Borders** | Warm greys, subtle |
| **Shadows** | Soft, warm-tinted |
| **Radius** | Friendly but not bubbly (8-12px) |
| **Icons** | Lucide React (outline, 1.5px stroke) |

---

## 15. Tech Stack & Cost Optimisation

### 14.1 Cost-Optimised Stack

| Component | Choice | Free Tier | Paid (when needed) |
|-----------|--------|-----------|-------------------|
| **Frontend Hosting** | Vercel | 100GB bandwidth | £16/mo (Pro) |
| **Database** | Supabase | 500MB, 50K MAU | £20/mo (Pro) |
| **Auth** | Supabase Auth | Included | Included |
| **File Storage** | Supabase Storage | 1GB | £0.021/GB |
| **AI (Text)** | Azure OpenAI GPT-4o-mini | Uses credits | ~£0.15/1M tokens |
| **AI (Images)** | Azure DALL-E 3 | Uses credits | ~£0.032/image |
| **AI (Backup)** | Replicate Flux | Pay-per-use | £0.003/image |
| **Email** | Resend | 3K/month | £16/mo |
| **Error Tracking** | Sentry | 5K errors/mo | Free tier OK |
| **Analytics** | PostHog | 1M events/mo | Free tier OK |

### 14.2 MVP Cost Projection

| Phase | Monthly Cost | Notes |
|-------|--------------|-------|
| Development (Weeks 1-10) | £0 | All free tiers + Azure credits |
| Early Users (Months 1-2) | £0-20 | May need Vercel Pro |
| Growth (Months 3-6) | £50-150 | Supabase Pro, more AI usage |
| Scale (Months 6-12) | £200-500 | Higher volume |

### 14.3 Dependency Choices

```json
{
  "frontend": {
    "react": "^19.0.0",
    "typescript": "^5.8.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "zustand": "^5.0.0",
    "react-router-dom": "^7.0.0",
    "@supabase/supabase-js": "^2.50.0",
    "lucide-react": "^0.450.0"
  },
  "backend": {
    "@supabase/supabase-js": "^2.50.0",
    "resend": "^4.0.0",
    "zod": "^3.24.0"
  },
  "dev": {
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

---

## 16. Project Structure

```
jigi/
├── apps/
│   └── web/                          # Main React application
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/               # Shared UI components
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Input.tsx
│       │   │   │   ├── Card.tsx
│       │   │   │   └── ...
│       │   │   ├── layout/           # Layout components
│       │   │   │   ├── AppLayout.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   └── Header.tsx
│       │   │   └── features/         # Feature-specific components
│       │   │       ├── onboarding/
│       │   │       ├── brands/
│       │   │       ├── campaigns/
│       │   │       ├── generation/
│       │   │       ├── review/
│       │   │       └── dashboard/
│       │   │
│       │   ├── pages/                # Route pages
│       │   │   ├── auth/
│       │   │   │   ├── Login.tsx
│       │   │   │   ├── Signup.tsx
│       │   │   │   └── Onboarding.tsx
│       │   │   ├── dashboard/
│       │   │   │   └── Dashboard.tsx
│       │   │   ├── brands/
│       │   │   │   ├── BrandList.tsx
│       │   │   │   └── BrandProfile.tsx
│       │   │   ├── campaigns/
│       │   │   │   ├── CampaignList.tsx
│       │   │   │   ├── CampaignDetail.tsx
│       │   │   │   └── CampaignCreate.tsx
│       │   │   ├── review/
│       │   │   │   ├── ReviewQueue.tsx
│       │   │   │   └── AssetReview.tsx
│       │   │   └── settings/
│       │   │       └── Settings.tsx
│       │   │
│       │   ├── lib/
│       │   │   ├── supabase.ts       # Supabase client
│       │   │   ├── api.ts            # API client helpers
│       │   │   └── utils.ts          # Utility functions
│       │   │
│       │   ├── stores/               # Zustand stores
│       │   │   ├── authStore.ts
│       │   │   ├── brandStore.ts
│       │   │   └── uiStore.ts
│       │   │
│       │   ├── hooks/                # Custom React hooks
│       │   │   ├── useAuth.ts
│       │   │   ├── useBrand.ts
│       │   │   └── useGeneration.ts
│       │   │
│       │   ├── types/                # TypeScript types
│       │   │   └── index.ts
│       │   │
│       │   ├── App.tsx               # Root component with routing
│       │   ├── main.tsx              # Entry point
│       │   └── index.css             # Global styles + Tailwind
│       │
│       ├── public/
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── packages/
│   └── api/                          # Serverless functions
│       ├── auth/
│       │   ├── signup.ts
│       │   ├── login.ts
│       │   └── invite.ts
│       │
│       ├── brands/
│       │   ├── index.ts              # GET, POST /brands
│       │   ├── [id].ts               # GET, PUT /brands/:id
│       │   └── onboarding.ts
│       │
│       ├── campaigns/
│       │   ├── index.ts
│       │   └── [id].ts
│       │
│       ├── generate/
│       │   ├── concepts.ts
│       │   ├── copy.ts
│       │   ├── image.ts
│       │   └── compliance.ts
│       │
│       ├── assets/
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   ├── submit.ts
│       │   ├── approve.ts
│       │   └── reject.ts
│       │
│       ├── comments/
│       │   └── index.ts
│       │
│       ├── notifications/
│       │   └── index.ts
│       │
│       └── lib/
│           ├── ai/
│           │   ├── orchestrator.ts
│           │   ├── prompts.ts
│           │   └── adapters/
│           │       ├── azure-openai.ts
│           │       ├── replicate.ts
│           │       └── types.ts
│           │
│           ├── auth.ts               # Auth helpers
│           ├── supabase.ts           # Server Supabase client
│           ├── email.ts              # Resend helpers
│           └── validation.ts         # Zod schemas
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260227000001_organisations.sql
│   │   ├── 20260227000002_users.sql
│   │   ├── 20260227000003_brands.sql
│   │   ├── 20260227000004_agency_access.sql
│   │   ├── 20260227000005_campaigns.sql
│   │   ├── 20260227000006_assets.sql
│   │   ├── 20260227000007_comments.sql
│   │   ├── 20260227000008_notifications.sql
│   │   └── 20260227000009_rls_policies.sql
│   │
│   └── seed.sql                      # Development seed data
│
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
├── README.md
└── JIGI_PROJECT_SPECIFICATION.md     # This document
```

---

## 17. Implementation Checklist

### 16.1 Project Setup

```
[ ] Create GitHub repository: jigi
[ ] Initialize with pnpm workspace
[ ] Set up apps/web with Vite + React + TypeScript
[ ] Set up packages/api structure
[ ] Configure Tailwind CSS
[ ] Set up ESLint + Prettier
[ ] Create .env.example with all variables
[ ] Create Supabase project
[ ] Create Vercel project
[ ] Link GitHub → Vercel
[ ] Configure environment variables in Vercel
```

### 16.2 Database Setup

```
[ ] Create organisations table + RLS
[ ] Create users table + RLS
[ ] Create brands table + RLS
[ ] Create agency_brand_access table + RLS
[ ] Create campaigns table + RLS
[ ] Create creative_assets table + RLS
[ ] Create asset_comments table + RLS
[ ] Create approval_actions table + RLS
[ ] Create notifications table + RLS
[ ] Create generation_log table
[ ] Set up auth trigger for user creation
[ ] Test RLS policies
```

### 16.3 Auth Implementation

```
[ ] Supabase Auth client setup
[ ] Sign up page
[ ] Sign in page
[ ] Password reset flow
[ ] Google OAuth (optional for MVP)
[ ] Auth state management (Zustand)
[ ] Protected route wrapper
[ ] Session persistence
```

### 16.4 Brand Onboarding

```
[ ] Organisation creation flow
[ ] Onboarding wizard component
[ ] Logo upload + storage
[ ] Colour extraction (basic)
[ ] Font selection UI
[ ] Tone selector component
[ ] Language rules input
[ ] Sample copy input
[ ] Team invitation
[ ] Agency connection
[ ] First generation demo
```

### 16.5 Generation Features

```
[ ] Azure OpenAI client setup
[ ] AI Orchestrator service
[ ] Concept generation prompt
[ ] Copy generation prompt
[ ] Image generation (DALL-E)
[ ] Compliance check prompt
[ ] Campaign creation UI
[ ] Generation UI
[ ] Asset saving
[ ] Generation history
```

### 16.6 Approval Features

```
[ ] Asset status management
[ ] Submit for review action
[ ] Review queue page
[ ] Asset review page
[ ] Comment creation
[ ] Approve action
[ ] Reject action
[ ] Request changes action
[ ] Status change notifications
```

### 16.7 Notifications

```
[ ] Resend client setup
[ ] Email templates (submission, approval, rejection)
[ ] Notification creation on actions
[ ] Notification list API
[ ] In-app notification display
[ ] Mark as read
[ ] 24hr nudge cron job
```

### 16.8 Dashboard & Polish

```
[ ] Dashboard page
[ ] Pending reviews widget
[ ] Recent campaigns widget
[ ] Quick actions
[ ] Approved assets view
[ ] Campaign detail page
[ ] Loading states
[ ] Error handling
[ ] Empty states
[ ] Mobile responsiveness check
```

---

## Appendix A: Environment Variables

```bash
# .env.example

# Supabase (Client)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# Supabase (Server)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_DEPLOYMENT_GPT=gpt-4o-mini
AZURE_OPENAI_DEPLOYMENT_DALLE=dall-e-3

# Replicate (Backup)
REPLICATE_API_KEY=xxx

# Resend
RESEND_API_KEY=re_xxx

# App
VITE_APP_URL=https://app.jigi.ai
```

---

## Appendix B: Key Decisions Log

| Decision | Choice | Date | Rationale |
|----------|--------|------|-----------|
| App name | Jigi | 2026-02-27 | Yoruba root, memorable, available |
| Business model | Brand pays, agency enables | 2026-02-27 | Agencies are distribution, brands have budget |
| Initial wedge | Advertising creatives | 2026-02-27 | High volume, measurable time savings |
| AI approach | Model-agnostic orchestration | 2026-02-27 | Flexibility, cost optimisation |
| DAM scope | Lightweight only | 2026-02-27 | Not competing with Bynder/Canto |
| State management | Zustand | 2026-02-27 | Lightweight, simple |
| Primary AI | Azure OpenAI | 2026-02-27 | Existing credits |
| MVP timeline | 8-10 weeks | 2026-02-27 | Validate core value fast |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Brand** | A company/organisation that owns brand guidelines and approves creative |
| **Agency** | A creative agency that generates creative on behalf of brands |
| **Campaign** | A collection of creative assets for a specific marketing initiative |
| **Asset** | A single piece of creative (concept, copy, or image) |
| **Brand Profile** | The complete set of brand constraints (identity + voice + strategy) |
| **Generation** | The process of creating creative using AI with brand constraints |
| **Compliance Check** | AI verification that generated content matches brand guidelines |
| **Submission** | The action of sending an asset from agency to brand for review |
| **Nudge** | A proactive reminder to review pending assets |

---

*Document Version: 1.0*  
*Last Updated: February 27, 2026*  
*Status: Ready for Implementation*
