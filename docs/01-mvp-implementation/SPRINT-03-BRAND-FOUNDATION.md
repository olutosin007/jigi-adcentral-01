# Sprint 03 — Brand Foundation

**Duration:** Week 3 (5 days)  
**Phase:** Foundation (3 of 3)  
**Goal:** Build brand profiles, onboarding wizard, and agency connections

---

## Sprint Objectives

1. Create brands table and related database structures
2. Build the complete brand onboarding wizard (6 steps)
3. Implement brand profile management
4. Enable agency-brand connections
5. Support deferred onboarding so Idea-First users can skip and retrofit later

---

## Deliverables

### Day 1: Database Schema (Brands)

- [ ] Create `brands` table migration
- [ ] Create `agency_brand_access` table migration
- [ ] Set up RLS policies for brands
- [ ] Set up RLS policies for agency access
- [ ] Apply migrations and test
- [ ] Add support fields for idea-first starter brand state

**Migration: brands**
```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
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
    
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    journey_mode TEXT DEFAULT 'brand_first' CHECK (journey_mode IN ('brand_first', 'idea_first')),
    brand_profile_status TEXT DEFAULT 'starter'
      CHECK (brand_profile_status IN ('starter', 'partial', 'complete')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Migration: agency_brand_access**
```sql
CREATE TABLE agency_brand_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"can_generate": true, "can_view_approved": true}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    invited_email TEXT,
    granted_at TIMESTAMPTZ,
    granted_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agency_organisation_id, brand_id)
);
```

**Starter brand profile requirement (Idea-First):**
- For users without assets, create a minimal brand record with:
  - brand name (or workspace name)
  - optional tone seed from text
  - empty identity defaults
- This record can be upgraded to full profile later without breaking campaigns.

### Day 2: Onboarding Wizard — Identity

**Using react-hook-form + zod for the wizard, colorthief for colour extraction.**

**Install dependencies:**
```bash
pnpm add react-hook-form @hookform/resolvers zod colorthief
pnpm dlx shadcn@latest add form  # shadcn form wrapper for react-hook-form
```

- [ ] Install react-hook-form, zod, colorthief
- [ ] Add shadcn Form component (wraps react-hook-form)
- [ ] Create `OnboardingWizard` container with multi-step form state
- [ ] Build Step 1: Logo Upload
- [ ] Build Step 2: Colour Extraction/Selection (using colorthief)
- [ ] Build Step 3: Typography Selection
- [ ] Implement file upload to Supabase Storage
- [ ] Add "Skip for now" path that preserves starter profile
- [ ] Persist onboarding progress so users can return later

**Onboarding Steps:**
```
Step 1: Logo Upload → Auto-extract colours
Step 2: Colour Palette → Confirm/edit colours
Step 3: Typography → Select heading/body fonts
Step 4: Tone → Select 3-5 tone descriptors
Step 5: Language Rules → Preferred/avoided words
Step 6: Team & Agency → Invite team, connect agency
```

**Idea-First Path in this sprint:**
```
Step 0: Starter Profile (name + optional tone seed)
Then either:
  A) Continue full onboarding now
  B) Skip and start generating immediately
```

**Multi-Step Wizard with react-hook-form:**
```typescript
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const onboardingSchema = z.object({
  // Step 1
  logoUrl: z.string().url().optional(),
  // Step 2
  colours: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    neutral: z.string(),
  }),
  // Step 3
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
  }),
  // Step 4
  tone: z.array(z.string()).min(3).max(5),
  // Step 5
  languageRules: z.object({
    preferredWords: z.array(z.string()),
    avoidedWords: z.array(z.string()),
  }),
  // Step 6
  teamInvites: z.array(z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'approver', 'reviewer']),
  })).optional(),
})

type OnboardingData = z.infer<typeof onboardingSchema>

function OnboardingWizard() {
  const [step, setStep] = useState(1)
  
  const methods = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { /* ... */ },
    mode: 'onBlur', // Validate on blur for better UX
  })
  
  const nextStep = async () => {
    // Validate only current step fields before proceeding
    const valid = await methods.trigger(getFieldsForStep(step))
    if (valid) setStep(s => s + 1)
  }
  
  return (
    <FormProvider {...methods}>
      {step === 1 && <LogoUploadStep />}
      {step === 2 && <ColourPaletteStep />}
      {/* ... */}
    </FormProvider>
  )
}
```

**Colour Extraction with colorthief:**
```typescript
import ColorThief from 'colorthief'

async function extractColours(imageUrl: string): Promise<string[]> {
  const colorThief = new ColorThief()
  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = imageUrl
  
  return new Promise((resolve) => {
    img.onload = () => {
      // Get palette of 6 colours, returns [r, g, b] arrays
      const palette = colorThief.getPalette(img, 6)
      // Convert to hex
      const hexColours = palette.map(([r, g, b]) => 
        '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      )
      resolve(hexColours)
    }
  })
}

// Usage in ColourPaletteStep
const ColourPaletteStep = () => {
  const { setValue, watch } = useFormContext()
  const logoUrl = watch('logoUrl')
  
  useEffect(() => {
    if (logoUrl) {
      extractColours(logoUrl).then(colours => {
        setValue('colours.primary', colours[0])
        setValue('colours.secondary', colours[1])
        // Allow user to override extracted colours
      })
    }
  }, [logoUrl])
  // ...
}
```

### Day 3: Onboarding Wizard — Voice

- [ ] Build Step 4: Tone Selection
- [ ] Build Step 5: Language Rules
- [ ] Add sample copy input (optional)
- [ ] Save brand voice data to database
- [ ] Add progress indicator to wizard

**Tone Descriptors (predefined options):**
```typescript
const TONE_OPTIONS = [
  'Friendly', 'Professional', 'Playful', 'Bold',
  'Warm', 'Confident', 'Minimal', 'Luxurious',
  'Witty', 'Authoritative', 'Caring', 'Edgy',
  'Innovative', 'Trustworthy', 'Casual', 'Sophisticated'
]
```

### Day 4: Onboarding Wizard — Team & Completion

- [ ] Build Step 6: Team Invitation UI
- [ ] Build Agency Connection UI
- [ ] Implement user invitation API endpoint
- [ ] Implement agency invitation API endpoint
- [ ] Add "First Generation Demo" step (placeholder)
- [ ] Mark onboarding as complete

**Team Invitation Flow:**
1. Enter email addresses
2. Select role (Admin, Approver, Reviewer)
3. Send invitation emails
4. Track pending invitations

**Agency Connection Flow:**
1. Enter agency email
2. Send connection request
3. Agency receives invitation
4. Agency accepts → access granted

### Day 5: Brand Profile Management

- [ ] Build Brand List page
- [ ] Build Brand Profile page
- [ ] Allow editing brand identity/voice
- [ ] Show connected agencies
- [ ] Show team members
- [ ] Implement brand switching (for agencies)
- [ ] Add "Complete your brand profile" nudges for starter profiles

**Brand Profile Sections:**
```
├── Brand Identity
│   ├── Logo
│   ├── Colours
│   └── Typography
├── Brand Voice
│   ├── Tone
│   ├── Language Rules
│   └── Sample Copy
├── Team
│   ├── Members list
│   └── Invite new
└── Connected Agencies
    ├── Active connections
    └── Pending invitations
```

---

## Technical Notes

### Supabase Storage Configuration

Create buckets in Supabase Storage:
- `brand-logos` — Public read, authenticated write
- `brand-assets` — Private, signed URLs

### Font Selection

Use Google Fonts for MVP:
```typescript
const POPULAR_FONTS = [
  'Inter', 'Poppins', 'Montserrat', 'Playfair Display',
  'Plus Jakarta Sans', 'DM Sans', 'Space Grotesk', 'Lora'
]
```

### Brand State Management

```typescript
interface BrandState {
  currentBrand: Brand | null
  brands: Brand[]
  isLoading: boolean
  fetchBrands: () => Promise<void>
  setBrand: (brand: Brand) => void
  updateBrand: (id: string, data: Partial<Brand>) => Promise<void>
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | List brands for current user/org |
| POST | `/api/brands` | Create new brand |
| GET | `/api/brands/:id` | Get brand details |
| PUT | `/api/brands/:id` | Update brand |
| POST | `/api/brands/:id/onboarding` | Save onboarding step |
| POST | `/api/brands/:id/invite-user` | Invite team member |
| POST | `/api/brands/:id/invite-agency` | Invite agency |

---

## Acceptance Criteria

- [ ] Users can complete full onboarding wizard
- [ ] Logo uploads work and colours are extracted
- [ ] Brand profile saves correctly to database
- [ ] Team members can be invited (email sent)
- [ ] Agencies can be invited (email sent)
- [ ] Brand profile can be edited after onboarding
- [ ] Users can skip onboarding and keep a valid starter profile
- [ ] Starter profile can be upgraded to full profile later
- [ ] Agencies can see connected brands
- [ ] RLS prevents unauthorized brand access

---

## Test Scenarios

1. **Complete onboarding:** Upload logo → Edit colours → Select fonts → Choose tone → Add language rules → Invite team → Complete
2. **Edit brand profile:** Change logo → Update colours → Save
3. **Agency connection:** Brand invites agency → Agency accepts → Agency can see brand
4. **Multi-brand:** Create 2 brands → Switch between them → Verify isolation
5. **Deferred onboarding:** Create starter profile → Skip onboarding → Return later → Complete profile

---

## Dependencies for Next Sprint

Sprint 04 requires:
- Brand profiles created and editable
- Brand identity/voice data available
- Agency-brand connections working
- File storage configured
- Starter profiles usable for campaign creation

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Colour extraction inaccurate | colorthief provides good results; allow manual override |
| File upload failures | Add retry logic, clear error messages |
| Complex wizard state | react-hook-form handles multi-step state cleanly |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **react-hook-form** | Zero re-renders, built-in validation, clean multi-step handling |
| **zod** | Type-safe schema, integrates with react-hook-form resolver |
| **colorthief** | Proven colour extraction library (~3KB), saves building from scratch |
| **shadcn Form** | Pre-built FormField, FormItem, FormLabel with accessibility |

---

*Sprint 03 of 10 — Foundation Phase*
