# Sprint 08 — Approval Actions & Notifications

**Duration:** Week 8 (5 days)  
**Phase:** Approval (2 of 3)  
**Goal:** Implement approval actions, commenting, and email notifications

---

## Sprint Objectives

1. Build Approve, Reject, and Request Changes actions
2. **Build approval action modals (Approve, Reject, Request Changes)**
3. **Build Comments sidebar UI**
4. **Build Notification bell and dropdown**
5. Implement basic commenting system
6. Set up Resend email integration
7. Create email notification templates
8. Ensure notifications and approvals work consistently for idea-first assets

---

## UI Components to Build This Sprint

| Component | Description |
|-----------|-------------|
| `ApproveModal` | Confirmation modal with optional note field |
| `RejectModal` | Modal requiring rejection reason |
| `RequestChangesModal` | Modal for feedback on needed changes |
| `CommentsSidebar` | Right panel showing asset comments |
| `CommentThread` | Threaded comment with replies |
| `CommentInput` | Textarea for adding new comment |
| `NotificationBell` | Header icon with unread count badge |
| `NotificationDropdown` | Dropdown list of recent notifications |
| `NotificationItem` | Single notification row with icon and message |

---

## Deliverables

### Day 1: Approval Actions API

- [ ] Create `/api/assets/:id/approve` endpoint
- [ ] Create `/api/assets/:id/reject` endpoint
- [ ] Create `/api/assets/:id/request-changes` endpoint
- [ ] Record approval actions in database
- [ ] Update asset status accordingly

**Migration: approval_actions**
```sql
CREATE TABLE approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Endpoint: POST /api/assets/:id/approve**
```typescript
export default async function handler(req, res) {
  const { id } = req.query
  const { notes } = req.body
  
  const supabase = createClient(req)
  
  // Fetch asset with campaign and brand
  const { data: asset } = await supabase
    .from('creative_assets')
    .select('*, campaigns(brand_id, brands(organisation_id))')
    .eq('id', id)
    .single()
  
  // Validate user can approve
  if (!canApprove(req.user, asset)) {
    return res.status(403).json({ error: 'Not authorized to approve' })
  }
  
  // Update status
  const { data: updated } = await supabase
    .from('creative_assets')
    .update({ status: 'approved' })
    .eq('id', id)
    .select()
    .single()
  
  // Record action
  await supabase.from('approval_actions').insert({
    asset_id: id,
    user_id: req.user.id,
    action: 'approve',
    notes
  })
  
  // Record status history
  await supabase.from('asset_status_history').insert({
    asset_id: id,
    user_id: req.user.id,
    from_status: asset.status,
    to_status: 'approved',
    notes
  })
  
  // Send notification to creator
  await sendApprovalNotification(asset, req.user, 'approved')
  
  return res.json({ asset: updated })
}
```

### Day 2: Approval UI Integration

- [ ] Add action modals with notes input
- [ ] Build confirmation dialogs
- [ ] Show action feedback (toast notifications)
- [ ] Update review page after action
- [ ] Navigate to next asset after action

**Approval Modal:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Approve Asset                                            [ X ] │
│                                                                 │
│  You're about to approve this asset. Once approved, it will     │
│  be available in the approved assets library.                   │
│                                                                 │
│  Add a note (optional):                                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Great work on the headline!                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                             [ Cancel ]  [ ✓ Approve Asset ]     │
└─────────────────────────────────────────────────────────────────┘
```

**Request Changes Modal:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Request Changes                                          [ X ] │
│                                                                 │
│  What changes are needed?                                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ The headline tone is too aggressive. Please try something│ │
│  │ warmer that aligns with our brand voice.                  │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  This will send the asset back to the creator for revision.     │
│                                                                 │
│                             [ Cancel ]  [ Request Changes ]     │
└─────────────────────────────────────────────────────────────────┘
```

### Day 3: Basic Commenting System

- [ ] Create comments API endpoints
- [ ] Build comment list component
- [ ] Add comment creation form
- [ ] Implement comment threading (reply to)
- [ ] Add comment resolution

**Migration: asset_comments**
```sql
CREATE TABLE asset_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES creative_assets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES asset_comments(id),
    
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Comments UI (in review sidebar):**
```
┌───────────────────────────────────────┐
│  Comments (3)                         │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ Jane Smith • 2h ago             │ │
│  │ The colour feels off-brand.     │ │
│  │ [ Reply ] [ ✓ Resolve ]         │ │
│  │                                 │ │
│  │   └─ Mike Chen • 1h ago         │ │
│  │      Updated to use primary     │ │
│  │      brand colour.              │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ Add a comment...                │ │
│  └─────────────────────────────────┘ │
│  [ Post Comment ]                     │
└───────────────────────────────────────┘
```

### Day 4: Resend Email Setup (using react-email)

**Use react-email to build maintainable email templates as React components.**

**Install react-email:**
```bash
pnpm add @react-email/components resend
```

- [ ] Set up Resend account and API key
- [ ] Install react-email components
- [ ] Create email templates as React components
- [ ] Set up Resend client with react-email
- [ ] Test email delivery

**Email Template Structure:**
```
packages/api/
└── emails/
    ├── components/
    │   ├── EmailLayout.tsx      # Base layout (logo, footer)
    │   ├── EmailButton.tsx      # CTA button component
    │   └── EmailText.tsx        # Styled text component
    ├── SubmissionEmail.tsx
    ├── ApprovalEmail.tsx
    ├── RejectionEmail.tsx
    └── ChangesRequestedEmail.tsx
```

**Email Template with react-email:**
```tsx
// packages/api/emails/SubmissionEmail.tsx

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SubmissionEmailProps {
  recipientName: string
  assetType: string
  campaignName: string
  submitterName: string
  reviewUrl: string
}

export function SubmissionEmail({
  recipientName,
  assetType,
  campaignName,
  submitterName,
  reviewUrl,
}: SubmissionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New {assetType} ready for review in {campaignName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://jigi.ai/logo.png"
            width={100}
            height={32}
            alt="Jigi"
          />
          
          <Heading style={heading}>
            New creative ready for review
          </Heading>
          
          <Text style={text}>
            Hi {recipientName},
          </Text>
          
          <Text style={text}>
            {submitterName} has submitted a {assetType} for review 
            in the "{campaignName}" campaign.
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={reviewUrl}>
              Review Now
            </Button>
          </Section>
          
          <Text style={footer}>
            This email was sent by Jigi.{' '}
            <a href="#">Manage notification settings</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#FAFAF9',
  fontFamily: '"Plus Jakarta Sans", sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '48px 24px',
  maxWidth: '600px',
}

const heading = {
  color: '#1C1917',
  fontSize: '24px',
  fontWeight: '600',
}

const text = {
  color: '#44403C',
  fontSize: '16px',
  lineHeight: '24px',
}

const buttonContainer = {
  margin: '24px 0',
}

const button = {
  backgroundColor: '#0D9488',
  borderRadius: '8px',
  color: '#FFFFFF',
  fontSize: '16px',
  fontWeight: '600',
  padding: '12px 24px',
  textDecoration: 'none',
}

const footer = {
  color: '#78716C',
  fontSize: '14px',
}

export default SubmissionEmail
```

**Resend Client with react-email:**
```typescript
// packages/api/lib/email.ts

import { Resend } from 'resend'
import { SubmissionEmail } from '../emails/SubmissionEmail'
import { ApprovalEmail } from '../emails/ApprovalEmail'
import { ChangesRequestedEmail } from '../emails/ChangesRequestedEmail'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendSubmissionEmail(data: {
  to: string
  recipientName: string
  assetType: string
  campaignName: string
  submitterName: string
  reviewUrl: string
}) {
  return resend.emails.send({
    from: 'Jigi <notifications@jigi.ai>',
    to: data.to,
    subject: `New ${data.assetType} ready for review`,
    react: SubmissionEmail({
      recipientName: data.recipientName,
      assetType: data.assetType,
      campaignName: data.campaignName,
      submitterName: data.submitterName,
      reviewUrl: data.reviewUrl,
    }),
  })
}

export async function sendApprovalEmail(data: { /* ... */ }) {
  return resend.emails.send({
    from: 'Jigi <notifications@jigi.ai>',
    to: data.to,
    subject: `Your ${data.assetType} was approved!`,
    react: ApprovalEmail(data),
  })
}

export async function sendChangesRequestedEmail(data: { /* ... */ }) {
  return resend.emails.send({
    from: 'Jigi <notifications@jigi.ai>',
    to: data.to,
    subject: `Changes requested for your ${data.assetType}`,
    react: ChangesRequestedEmail(data),
  })
}
```

**Benefits of react-email:**
| Benefit | Description |
|---------|-------------|
| **Type-safe props** | Each email is a typed React component |
| **Reusable components** | Share header, footer, button across emails |
| **Preview locally** | `pnpm email:dev` to preview templates |
| **Resend integration** | Native support, renders to HTML at send time |
| **No runtime cost** | Renders server-side, 0KB client bundle |

### Day 5: Notification Triggers

- [ ] Create notifications table
- [ ] Trigger email on submission
- [ ] Trigger email on approval
- [ ] Trigger email on rejection
- [ ] Trigger email on changes requested
- [ ] Build in-app notification display
- [ ] Include asset context labels in notifications (idea-first vs brand-grounded)

**Migration: notifications**
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL,
    -- Types: submission, approval, rejection, changes_requested, 
    --        nudge_reminder, comment_added
    
    title TEXT NOT NULL,
    body TEXT,
    
    related_asset_id UUID REFERENCES creative_assets(id),
    related_campaign_id UUID REFERENCES campaigns(id),
    generation_mode TEXT CHECK (generation_mode IN ('brand_grounded', 'idea_first')),
    
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notification Trigger Function:**
```typescript
async function createNotification(
  supabase: SupabaseClient,
  notification: {
    userId: string
    type: string
    title: string
    body?: string
    relatedAssetId?: string
    relatedCampaignId?: string
    generationMode?: 'brand_grounded' | 'idea_first'
    sendEmail?: boolean
  }
) {
  // Create in-app notification
  const { data: notif } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      related_asset_id: notification.relatedAssetId,
      related_campaign_id: notification.relatedCampaignId,
      generation_mode: notification.generationMode
    })
    .select()
    .single()
  
  // Send email if requested
  if (notification.sendEmail) {
    const user = await getUser(supabase, notification.userId)
    
    await sendEmail({
      to: user.email,
      subject: notification.title,
      html: buildEmailTemplate(notification.type, { ... })
    })
    
    await supabase
      .from('notifications')
      .update({ email_sent: true, email_sent_at: new Date() })
      .eq('id', notif.id)
  }
  
  return notif
}
```

---

## Technical Notes

### Email Deliverability

- Use Resend's verified domain feature
- Set up SPF/DKIM records
- Keep emails simple and transactional
- Include unsubscribe mechanism

### Notification Bell

```typescript
// Header notification bell component
function NotificationBell() {
  const { notifications, unreadCount } = useNotifications()
  
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-white 
                           text-xs rounded-full h-4 w-4 flex items-center 
                           justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <NotificationList notifications={notifications} />
      </PopoverContent>
    </Popover>
  )
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assets/:id/approve` | Approve asset |
| POST | `/api/assets/:id/reject` | Reject asset |
| POST | `/api/assets/:id/request-changes` | Request changes |
| GET | `/api/assets/:id/comments` | Get asset comments |
| POST | `/api/assets/:id/comments` | Add comment |
| PUT | `/api/comments/:id/resolve` | Resolve comment |
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

---

## Acceptance Criteria

- [ ] Approve action updates status and records history
- [ ] Reject action works with required notes
- [ ] Request Changes sends asset back to creator
- [ ] Comments can be added to assets
- [ ] Comment threads work (reply to)
- [ ] Comments can be resolved
- [ ] Submission triggers email to reviewers
- [ ] Approval triggers email to creator
- [ ] In-app notifications appear in bell
- [ ] Notifications can be marked as read
- [ ] Notification copy remains clear when asset came from idea-first flow

---

## Test Scenarios

1. **Approve flow:** Review → Approve → See approved status → Creator gets email
2. **Reject flow:** Review → Reject with notes → Status updated → Email sent
3. **Request changes:** Review → Request Changes → Asset returns to creator
4. **Comments:** Add comment → Reply → Resolve → See resolved state
5. **Notifications:** Action triggers → Bell shows unread → Click → Mark read
6. **Idea-first notification:** Idea-first asset approved → Creator gets accurate context in email and in-app alert

---

## Dependencies for Next Sprint

Sprint 09 requires:
- Approval actions working
- Email notifications sending
- In-app notifications functional
- Comment system working

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Email delivery issues | Test with real addresses, monitor Resend dashboard |
| Notification spam | Group notifications, respect quiet hours |
| Comment clutter | Add resolve/hide resolved features |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **react-email** | Type-safe, reusable email templates as React components |
| **shadcn Dialog** | Pre-built accessible modals for approve/reject/changes |
| **shadcn Popover** | Notification dropdown (already added in Sprint 01) |
| **TanStack Query** | Real-time notification polling, cache invalidation |

**Add shadcn Alert Dialog for confirmations:**
```bash
pnpm dlx shadcn@latest add alert-dialog
```

**Polling for Notifications with TanStack Query:**
```typescript
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  })
}
```

---

*Sprint 08 of 10 — Approval Phase*
