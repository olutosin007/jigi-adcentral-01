# Sprint 10 — Polish & Launch

**Duration:** Week 10 (5 days)  
**Phase:** Polish & Launch (Final)  
**Goal:** Test, fix bugs, document, and onboard first users

---

## Sprint Objectives

1. Comprehensive end-to-end testing
2. Bug fixes and polish
3. Documentation and onboarding materials
4. First pilot user onboarding
5. Validate both production journeys: Brand-First and Idea-First (with retrofit)

---

## Deliverables

### Day 1: End-to-End Testing

- [ ] Test complete Brand signup flow
- [ ] Test complete Agency signup flow
- [ ] Test complete Idea-First startup flow (no brand assets)
- [ ] Test brand-agency connection
- [ ] Test full generation workflow
- [ ] Test retrofit flow (add brand profile after initial generation)
- [ ] Test full approval workflow
- [ ] Test notification delivery
- [ ] Document all bugs found

**Test Scenarios Matrix:**

| Flow | Test Case | Status |
|------|-----------|--------|
| **Auth** | Brand signup → Email verification → Org setup | |
| **Auth** | Agency signup → Email verification → Org setup | |
| **Auth** | Login → Session persistence → Logout | |
| **Auth** | Password reset flow | |
| **Onboarding** | Full wizard: Logo → Colours → Fonts → Tone → Language → Team | |
| **Idea-First** | Signup → Org setup → Generate from text without brand assets | |
| **Retrofit** | Start idea-first → complete brand profile later → regenerate with constraints | |
| **Connection** | Brand invites agency → Agency accepts → Access granted | |
| **Campaign** | Create campaign → Fill brief → Save | |
| **Generation** | Generate concepts → Generate copy → Generate image | |
| **Generation** | Compliance check runs → Results display | |
| **Submission** | Submit asset → Status changes → Notification sent | |
| **Review** | View queue → Open asset → Approve | |
| **Review** | View queue → Open asset → Request changes | |
| **Review** | View queue → Open asset → Reject | |
| **Comments** | Add comment → Reply → Resolve | |
| **Nudge** | Asset pending → 24h passes → Nudge sent | |
| **Dashboard** | View stats → View pending → Navigate | |
| **Approved** | View approved assets → Download | |

### Day 2: Bug Fixes (Priority)

- [ ] Fix all P0 bugs (blocking flows)
- [ ] Fix P1 bugs (major issues)
- [ ] Address P2 bugs (nice to fix)
- [ ] Defer P3 bugs (cosmetic/minor)

**Bug Priority Definitions:**

| Priority | Definition | Action |
|----------|------------|--------|
| P0 | Blocks core user flow (auth, generation, approval) | Must fix before launch |
| P1 | Significantly degrades experience | Fix if time allows |
| P2 | Annoying but workaround exists | Defer to post-launch |
| P3 | Cosmetic or edge case | Add to backlog |

**Bug Tracking Template:**
```markdown
## Bug: [Title]
**Priority:** P0/P1/P2/P3
**Found in:** [Flow/Page]
**Steps to reproduce:**
1. Step one
2. Step two
3. Step three

**Expected:** What should happen
**Actual:** What actually happens
**Screenshot:** (if applicable)
**Fixed in:** [commit hash]
```

### Day 3: Performance & Security Review

- [ ] Audit all API endpoints for auth
- [ ] Verify RLS policies work correctly
- [ ] Check for exposed secrets
- [ ] Test rate limiting
- [ ] Review error messages (no sensitive info)
- [ ] Optimize slow pages

**Security Checklist:**

| Item | Status |
|------|--------|
| All API keys server-side only | |
| No secrets in client bundle | |
| Auth required on all protected endpoints | |
| RLS policies tested with different users | |
| Error messages don't leak internal details | |
| File upload restrictions in place | |
| CORS configured correctly | |

**Performance Checks:**

| Page | Target | Actual |
|------|--------|--------|
| Dashboard | < 2s | |
| Campaign List | < 1.5s | |
| Campaign Detail | < 2s | |
| Review Queue | < 1.5s | |
| Asset Review | < 2s | |
| Generation | < 30s | |

### Day 4: Documentation

- [ ] Write README.md with setup instructions
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Write API documentation
- [ ] Create user guide outline
- [ ] Prepare onboarding email templates
- [ ] Document dual-journey UX in user guide (Brand-First + Idea-First)

**README Structure:**
```markdown
# Jigi

Brand-grounded creative generation with approval built in.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Supabase account
- Azure OpenAI access

### Installation
pnpm install

### Environment Setup
cp .env.example .env.local
# Fill in your keys

### Development
pnpm dev

### Deployment
Automatic via Vercel on push to main.

## Architecture
[Brief overview with diagram]

## Project Structure
[Folder structure explanation]

## Contributing
[Guidelines for future development]
```

**User Guide Outline:**
```markdown
# Jigi User Guide

## Getting Started
- Creating your account
- Setting up your brand profile

## Brand Setup
- Uploading your logo
- Defining your colour palette
- Setting up your brand voice

## Working with Agencies
- Inviting your agency
- Managing permissions

## Reviewing Creative
- Understanding the review queue
- Approving, rejecting, and requesting changes
- Using comments effectively

## Managing Approved Assets
- Finding approved creative
- Downloading assets
```

### Day 5: Pilot Onboarding

- [ ] Identify pilot brand (internal or friendly)
- [ ] Identify pilot agency (internal or partner)
- [ ] Run guided onboarding session
- [ ] Collect initial feedback
- [ ] Make critical fixes if needed
- [ ] Celebrate launch! 🎉

**Pilot Onboarding Agenda (1.5 hours):**

```
0:00 - 0:05  Introduction and goals
0:05 - 0:15  Brand signup and onboarding
0:15 - 0:25  Agency signup and connection
0:25 - 0:35  First campaign creation
0:35 - 0:50  Generate concepts, copy, and images
0:50 - 1:00  Submit for review
1:00 - 1:15  Brand reviews and approves
1:15 - 1:25  Explore approved assets
1:25 - 1:30  Feedback and Q&A
```

**Feedback Questions:**
1. How intuitive was the onboarding process?
2. Did the generated creative match your brand?
3. How does the review process compare to your current workflow?
4. What's missing that you'd need to use this daily?
5. Would you recommend this to colleagues?

---

## Launch Checklist

### Technical
- [ ] All tests passing
- [ ] No P0/P1 bugs open
- [ ] Environment variables configured
- [ ] Vercel deployment working
- [ ] Supabase production project ready
- [ ] Email sending from production domain
- [ ] Monitoring/logging in place

### Content
- [ ] README complete
- [ ] Environment variables documented
- [ ] User guide drafted
- [ ] Onboarding email templates ready

### Business
- [ ] Pilot brand confirmed
- [ ] Pilot agency confirmed
- [ ] Onboarding session scheduled
- [ ] Feedback collection plan ready
- [ ] Post-launch iteration plan drafted

---

## Post-Launch Immediate Actions

### Week 1 After Launch
- [ ] Monitor error logs daily
- [ ] Collect and triage feedback
- [ ] Fix any critical issues discovered
- [ ] Check email deliverability
- [ ] Monitor AI costs

### Metrics to Track
| Metric | Target | Method |
|--------|--------|--------|
| Signup completion rate | > 80% | Supabase analytics |
| Onboarding completion | > 60% | Custom tracking |
| First campaign created | > 50% of users | Database query |
| Assets generated | > 10 per user | Database query |
| Approval turnaround time | < 48 hours | Status history |
| User satisfaction (NPS) | > 40 | Survey |

---

## MVP Success Criteria Validation

By end of Sprint 10, validate:

| Criteria | How to Measure | Target |
|----------|---------------|--------|
| Agency can generate brand-grounded creative | Pilot generates for connected brand | ✓ Works |
| Agency can generate without brand assets | Pilot runs idea-first generation from text | ✓ Works |
| Brand can be retro-fitted after idea-first | Pilot upgrades starter profile and sees improved outputs | ✓ Works |
| Brands can review and approve | Pilot brand completes review | ✓ Works |
| Time to approval reduced | Compare to stated baseline | Measurable |
| Brand willing to pay | Explicit feedback in session | At least 1 yes |

---

## Known Limitations (Post-MVP)

Document these for future sprints:

| Limitation | Impact | When to Address |
|------------|--------|-----------------|
| No pin comments on images | Less precise feedback | Month 1 |
| No threaded comment replies | Complex discussions harder | Month 1 |
| Single AI model | No fallback options | Month 3 |
| No real-time updates | Users must refresh | Month 2 |
| Basic search | Hard to find old assets | Month 2 |
| No mobile app | Can't approve on the go | Year 1 |

---

## Handoff Notes

For future development:

### Code Quality
- TypeScript strict mode throughout
- ESLint + Prettier configured
- Consistent folder structure

### Architecture Decisions
- Zustand for simple state (not Redux)
- Server components not used (Vite, not Next.js)
- RLS for data isolation (not API-level auth checks)

### Scaling Considerations
- Database indexes on frequently queried columns
- Supabase connection pooling when needed
- Consider Redis for caching if dashboard slows

### Technical Debt
- [ ] Add comprehensive test coverage
- [ ] Implement proper error boundaries
- [ ] Add analytics tracking
- [ ] Set up proper CI/CD pipeline

---

## Celebration 🎉

Congratulations on completing the MVP! 

The team has built:
- A complete brand onboarding system
- AI-powered creative generation
- A full approval workflow
- Email notifications and nudging
- A polished dashboard experience

This is a solid foundation for validating the Jigi value proposition.

---

*Sprint 10 of 10 — MVP Complete!*
