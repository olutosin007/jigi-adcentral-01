# Campaign Sample Templates — ezihub

Sample campaign briefs for **ezihub**, an HRTech platform in the talent validation and accreditation space. Use these to test brand enforcement, CCO compilation, validation pipeline, and drift detection.

---

## Campaign 1: Pre-Launch — "Coming Soon"

### Basics

| Field | Value |
|-------|-------|
| **Campaign Name** | ezihub Pre-Launch — Talent Validation Reimagined |
| **Brand** | ezihub |

### Campaign Brief

**Campaign Objective** (required)

> Build anticipation and early interest for ezihub's launch among HR and L&D leaders. Create curiosity about the platform's approach to talent validation and accreditation, and encourage sign-ups for early access and launch updates.

**Target Audience** (required)

> HR directors, talent acquisition leads, L&D managers, and people operations leaders at mid-to-large organisations (500+ employees). They care about hiring quality, reducing bias, and proving skills. They are time-poor, sceptical of new tools, and need clear ROI. They consume content on LinkedIn, industry newsletters, and HR podcasts.

**Key Message** (required, max 500 chars)

> ezihub is reimagining how organisations validate and accredit talent — so you can hire with confidence and prove what people can do.

**Tone Override** (optional)

> Professional, Confident, Aspirational

**Target Channels** (required)

> - LinkedIn Post  
> - Instagram Post  
> - Email Header  
> - Website Banner  

**Additional Requirements** (optional)

> - Use "coming soon" and "early access" framing.  
> - Avoid specific launch dates unless confirmed.  
> - Include a clear CTA for early access sign-up or waitlist.  

**Exclusions** (optional, max 1000 chars)

> Avoid mentioning competitor names (e.g. Hired, Codility, TestGorilla). No stock-photo clichés (handshakes, generic office scenes). No jargon like "synergy" or "disruption". Do not promise features not yet in the product.

### Starter Prompts (Pre-Launch)

Use these to seed generation when creating assets for this campaign.

**Concept prompt** (for concept generation)

> A teaser campaign for an HRTech platform launching soon. Focus on curiosity and anticipation: "What if you could prove what people can do?" Themes: validation, accreditation, confidence in hiring. Visual direction: modern, clean, professional — abstract representations of verified skills or credentials, not literal office scenes.

**Copy prompt** (for copy generation)

> Teaser copy for early access sign-up. Headline should create curiosity about talent validation. Body: 2–3 short sentences on why HR leaders should care. CTA: "Join the waitlist" or "Get early access". Tone: professional, confident, aspirational. No launch dates.

**Image prompt** (for image generation)

> Modern, minimalist illustration or photograph suggesting verified talent or credentials. Abstract shapes, checkmarks, or subtle "coming soon" visual cues. Clean background, professional colour palette. Avoid handshakes, generic offices, or stock-photo clichés. Mood: anticipation, trust, innovation.

---

## Campaign 2: Launch — "Now Live"

### Basics

| Field | Value |
|-------|-------|
| **Campaign Name** | ezihub Launch — Validate Talent, Prove Skills |
| **Brand** | ezihub |

### Campaign Brief

**Campaign Objective** (required)

> Announce ezihub's launch and drive sign-ups and demos. Show HR and L&D teams how the platform helps them validate talent and accredit skills with confidence. Focus on credibility, clarity, and conversion.

**Target Audience** (required)

> Same as pre-launch: HR directors, talent acquisition leads, L&D managers, and people operations leaders at mid-to-large organisations. They are evaluating tools, need proof of value, and want to see how ezihub fits their workflows.

**Key Message** (required, max 500 chars)

> ezihub is live: validate talent and accredit skills with confidence. Hire based on proof, not promises.

**Tone Override** (optional)

> Professional, Confident, Accessible

**Target Channels** (required)

> - LinkedIn Post  
> - Facebook Post  
> - Facebook Ad  
> - Display Ad  
> - Website Banner  
> - Email Header  

**Additional Requirements** (optional)

> - Include a clear CTA (e.g. "Book a demo", "Start free trial", "Get early access").  
> - Emphasise validation, accreditation, and proof of skills.  
> - Keep messaging consistent across channels.  

**Exclusions** (optional, max 1000 chars)

> Same as pre-launch: avoid competitor names, stock-photo clichés, and vague jargon. Do not overstate features or make claims that cannot be supported.

### Starter Prompts (Launch)

Use these to seed generation when creating assets for this campaign.

**Concept prompt** (for concept generation)

> Launch campaign for an HRTech platform that validates and accredits talent. Focus on proof over promises: hire based on verified skills. Themes: validation, accreditation, confidence, proof. Visual direction: bold, clear, professional — imagery that suggests verified credentials, proven outcomes, or confident hiring decisions.

**Copy prompt** (for copy generation)

> Launch announcement copy with clear CTA. Headline should emphasise "live" or "now available" and the benefit of proof-based hiring. Body: 2–3 sentences on what ezihub does and why it matters. CTA: "Book a demo", "Start free trial", or "Get early access". Tone: professional, confident, accessible.

**Image prompt** (for image generation)

> Bold, professional visual for a talent validation platform launch. Imagery suggesting proof, verification, or accredited skills — e.g. badges, checkmarks, confident professionals. Clean layout, strong typography if text is included. Avoid handshakes and generic offices. Mood: credibility, clarity, confidence. Suitable for LinkedIn, display ads, and website banners.

---

## App Field Values Reference

Use these `value` strings when selecting channels in the Create Campaign form:

| Channel | Value |
|---------|-------|
| LinkedIn Post | `linkedin_post` |
| Instagram Post | `instagram_post` |
| Instagram Story | `instagram_story` |
| Instagram Reel | `instagram_reel` |
| Facebook Post | `facebook_post` |
| Facebook Ad | `facebook_ad` |
| Twitter/X Post | `twitter_post` |
| Display Ad | `display_ad` |
| Website Banner | `website_banner` |
| Email Header | `email_header` |
| Other | `other` |

**Tone values:** `professional`, `confident`, `aspirational`, `accessible`, `playful`, `bold`, `warm`, `energetic`, `minimal`, `luxury`

---

## Testing Notes

These briefs are designed to exercise:

1. **Copy enforcement** — Exclusions and key message are specific enough to test concept/copy/image validation.
2. **Channel constraints** — Different channel mixes between pre-launch and launch.
3. **Tone** — Tone overrides are set so you can verify tone alignment.
4. **Drift detection** — Edit one brief and re-run validation to trigger drift flagging.
5. **Reference assets** — Add ezihub logos or mood boards after creation to test reference-asset handling.
