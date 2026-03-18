

**JIGI**

Campaign Context Object &  
Generation Enforcement Specification

Technical specification for wiring the Campaign Brief into all downstream generation calls across the Concept, Copy, and Image tracks.

**Version:** 1.0

**Date:** 15 March 2026

**Author:** Jigi Product & Engineering

**Status:** Draft

**Classification:** Internal / Confidential

# **1\. Overview & Purpose**

This specification defines the Campaign Context Object (CCO) — a structured data payload compiled from the Campaign Brief at the moment the user saves it. The CCO is injected as system-level instructions into every generation, import-validation, and evaluation call across all three creative tracks: Concept, Copy, and Image.

The CCO works in concert with the Brand Intelligence Object (BIO), which is a persistent, workspace-level payload containing the client’s brand identity, voice, visual rules, and messaging architecture. Together, these two layers ensure that every piece of creative output is both strategically aligned to the campaign and compliant with the brand’s identity — without requiring the user to restate context.

## **1.1 System Architecture: Three-Layer Injection**

Every generation call in Jigi receives three stacked instruction layers, applied in this priority order:

* Layer 1 — Brand Intelligence Object (BIO): Persistent, workspace-level. Contains brand voice, visual identity, messaging architecture, audience definitions, and compliance rules. Set once per client workspace by an admin or during onboarding.

* Layer 2 — Campaign Context Object (CCO): Project-level. Compiled from the Campaign Brief at save-time. Contains strategic objective, audience targeting, channel constraints, tone calibration, key message, and additional requirements. Active for the lifetime of the campaign.

* Layer 3 — Track-Specific Template: Governs the output structure and validation criteria for each track (Concept, Copy, Image). Defines what fields the AI must return and what scoring rubric applies.

If there is a conflict between layers, the higher-numbered layer wins within its scope. For example, if the BIO says the brand tone is “professional” but the CCO sets a tone override to “playful” for a specific campaign, the CCO’s tone applies to all generation within that campaign.

# **2\. Campaign Brief Input Schema**

These are the fields captured on the Campaign Brief screen. Fields marked with an asterisk are new additions recommended to strengthen downstream generation quality.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **objective** | string | Yes | The campaign’s strategic goal. Free text. Parsed by the compiler into goal\_type and emotional\_register. |
| **target\_audience** | string | Yes | Description of the primary audience. Parsed into demographic cues, psychographic traits, and language register. |
| **channels** | string\[\] | Yes | Selected output channels. Each channel maps to a format\_constraints object (dimensions, character limits, layout rules). |
| **additional\_requirements** | string | No | Freeform hard constraints. Injected verbatim as override rules into the system prompt. |
| **key\_message \*** | string | Yes | The single message this campaign must communicate. Becomes the anchor every concept, copy variant, and image must serve. |
| **tone\_override \*** | enum\[\] | No | Tone modifiers selected from brand-approved palette. E.g. \[playful, bold\]. Overrides BIO defaults for this campaign. |
| **reference\_assets \*** | file\[\] | No | Uploaded mood boards, competitor examples, or previous campaign assets. Fed to image and concept tracks as positive/negative references. |
| **exclusions \*** | string | No | Explicit things to avoid: competitor names, visual cliches, banned phrases, sensitive topics. |

# **3\. Campaign Context Object (CCO) — Compiled Schema**

When the user saves the Campaign Brief, Jigi’s brief compiler transforms the raw inputs into this structured object. The compiler uses the BIO and a channel-constraints library to enrich the raw brief data.

## **3.1 Root Object**

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **campaign\_id** | uuid | Auto | Unique campaign identifier. |
| **brand\_id** | uuid | Auto | Reference to the parent Brand Intelligence Object. |
| **compiled\_at** | ISO 8601 | Auto | Timestamp of compilation. Used for drift detection. |
| **version** | integer | Auto | Increments on every brief edit. Triggers re-validation of existing assets. |
| **strategic\_context** | object | Yes | Parsed from objective and key\_message. See 3.2. |
| **audience\_context** | object | Yes | Parsed from target\_audience. See 3.3. |
| **channel\_constraints** | object\[\] | Yes | One entry per selected channel. See 3.4. |
| **tone\_profile** | object | Yes | Merged from BIO defaults \+ campaign tone\_override. See 3.5. |
| **hard\_constraints** | object | Yes | From additional\_requirements and exclusions. See 3.6. |
| **reference\_assets** | object\[\] | No | Processed reference files with classification. See 3.7. |

## **3.2 strategic\_context**

Derived from the objective and key\_message fields via a classification pass.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **objective\_raw** | string | — | Verbatim objective text from brief. |
| **goal\_type** | enum | Auto | Classified: awareness | engagement | conversion | retention | launch | event. |
| **emotional\_register** | string\[\] | Auto | Inferred emotional qualities. E.g. \[excitement, discovery, aspiration\]. |
| **key\_message** | string | — | Verbatim from brief. The non-negotiable message. |
| **value\_prop\_alignment** | string | Auto | Which BIO value proposition this campaign serves. Matched automatically. |

## **3.3 audience\_context**

Derived from the target\_audience field via NLP parsing.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **audience\_raw** | string | — | Verbatim audience text from brief. |
| **demographic\_cues** | object | Auto | Inferred age range, location, profession signals. |
| **psychographic\_traits** | string\[\] | Auto | E.g. \[aspirational, creative, price-sensitive\]. |
| **language\_register** | enum | Auto | formal | conversational | slang-friendly | technical. Governs copy generation vocabulary. |
| **cultural\_context** | string\[\] | Auto | Relevant cultural references, sensitivities, or localisation notes. |

## **3.4 channel\_constraints**

One object per selected channel. Populated from Jigi’s channel-constraints library — the user does not need to enter these manually.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **channel\_id** | enum | — | E.g. instagram\_story, linkedin\_post, display\_ad. |
| **image\_dimensions** | object | — | width, height, aspect\_ratio, safe\_zones. E.g. {w: 1080, h: 1920, ratio: "9:16"}. |
| **copy\_limits** | object | — | max\_chars, max\_lines, headline\_max, cta\_max per format. |
| **format\_rules** | string\[\] | — | Channel-specific rules. E.g. \["text overlay must be in top 40% for Stories", "no links in caption for Reels"\]. |
| **content\_type** | enum | — | static\_image | video | carousel | text\_only | mixed. |

## **3.5 tone\_profile**

Merged from BIO brand voice defaults and any campaign-level tone\_override.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **base\_tone** | string\[\] | — | From BIO. E.g. \[confident, warm, accessible\]. |
| **campaign\_modifiers** | string\[\] | — | From tone\_override. E.g. \[playful, bold\]. Applied on top of base. |
| **effective\_tone** | string\[\] | Auto | Merged result. E.g. \[confident, warm, playful, bold\]. This is what the AI receives. |
| **vocabulary\_guidance** | string | Auto | Natural-language instruction derived from tone. E.g. "Use energetic, short sentences. Contractions allowed. Avoid corporate jargon." |

## **3.6 hard\_constraints**

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **requirements\_raw** | string | — | Verbatim additional\_requirements from brief. |
| **exclusions\_raw** | string | — | Verbatim exclusions from brief. |
| **parsed\_requirements** | string\[\] | Auto | Structured list of positive requirements. |
| **parsed\_exclusions** | string\[\] | Auto | Structured list of things to avoid. |
| **legal\_disclaimers** | string\[\] | Auto | Pulled from BIO if the channel or industry requires them. |

## **3.7 reference\_assets**

Each uploaded reference asset is classified and tagged for downstream use.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **asset\_id** | uuid | Auto | Unique reference. |
| **file\_url** | string | — | Storage path. |
| **classification** | enum | Auto | mood\_board | competitor\_example | previous\_campaign | style\_reference | negative\_reference. |
| **applicable\_tracks** | enum\[\] | Auto | Which tracks should receive this: \[concept, copy, image\]. |
| **description** | string | Auto | AI-generated summary of what this reference communicates visually/tonally. |

# **4\. Generation Enforcement Architecture**

This section defines how the CCO is injected into each generation track and how compliance is validated.

## **4.1 System Prompt Assembly**

Every generation call in Jigi assembles a system prompt from three sources in this exact order. The AI model receives the combined prompt as its system instruction, meaning it governs all output without the user needing to write or see any of it.

| Priority | Source | Content Injected |
| :---- | :---- | :---- |
| 1 (Base) | **Brand Intelligence Object** | Brand voice descriptors, visual identity rules (colours, typography, photography style), messaging architecture, approved claims, regulatory constraints, audience personas. |
| 2 (Campaign) | **Campaign Context Object** | strategic\_context, audience\_context, channel\_constraints, tone\_profile, hard\_constraints, reference\_asset descriptions. Overrides BIO defaults where specified. |
| 3 (Track) | **Track Template** | Output schema definition, required fields, scoring rubric, validation rules specific to Concept / Copy / Image. |

## **4.2 Track 1: Concept Generation**

The Concept track produces structured creative briefs, not freeform ideas. Every concept must trace back to the campaign’s key\_message and one of the brand’s approved value propositions.

### **4.2.1 Concept Output Schema**

The AI must return output conforming to this structure. Missing or empty required fields trigger a regeneration.

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **concept\_name** | string | Yes | A memorable, concise name for the concept. |
| **strategic\_insight** | string | Yes | The human truth this concept connects to. Must reference audience\_context psychographic traits. |
| **creative\_territory** | string | Yes | The emotional and visual world this concept lives in. Must align with tone\_profile.effective\_tone. |
| **headline\_direction** | string | Yes | A headline or tagline direction (not final copy). Must serve the key\_message. |
| **format\_suitability** | string\[\] | Yes | Which channels from channel\_constraints this concept works for. Auto-checked against selected channels. |
| **key\_message\_link** | string | Yes | Explicit statement of how this concept delivers the key\_message. Enforces traceability. |
| **brand\_alignment\_score** | number | Yes | 0–100 score. Auto-generated by validation pass against BIO value propositions. |
| **brand\_alignment\_rationale** | string | Yes | Explanation of score. Flags any tension with brand guidelines. |

### **4.2.2 Concept System Prompt Template**

The following template is assembled by Jigi and sent as the system prompt for concept generation. Placeholders in curly braces are replaced with CCO and BIO values at runtime.

ROLE: You are a senior creative strategist generating campaign concepts.

BRAND CONTEXT:

  Brand voice: {bio.voice\_descriptors}

  Value propositions: {bio.value\_propositions}

  Messaging architecture: {bio.messaging\_architecture}

CAMPAIGN CONTEXT:

  Objective: {cco.strategic\_context.objective\_raw}

  Goal type: {cco.strategic\_context.goal\_type}

  Emotional register: {cco.strategic\_context.emotional\_register}

  Key message: {cco.strategic\_context.key\_message}

  Target audience: {cco.audience\_context.audience\_raw}

  Psychographic traits: {cco.audience\_context.psychographic\_traits}

  Cultural context: {cco.audience\_context.cultural\_context}

  Tone: {cco.tone\_profile.effective\_tone}

  Channels: {cco.channel\_constraints\[\].channel\_id}

HARD CONSTRAINTS:

  Requirements: {cco.hard\_constraints.parsed\_requirements}

  Exclusions: {cco.hard\_constraints.parsed\_exclusions}

REFERENCE DIRECTION:

  {cco.reference\_assets\[applicable\_tracks includes concept\].description}

OUTPUT: Return a JSON object matching the Concept Output Schema.

Every concept MUST serve the key message.

Every concept MUST link to at least one brand value proposition.

Score brand alignment honestly; flag tensions, do not suppress them.

### **4.2.3 Concept Validation Rules**

* key\_message\_link must not be empty and must semantically reference the key\_message.

* brand\_alignment\_score below 60 triggers a warning flag visible to the user.

* format\_suitability must include at least one channel from the campaign’s selected channels.

* strategic\_insight must reference at least one psychographic\_trait from audience\_context.

* Imported concepts (not AI-generated) run through the same validation pass and receive the same scoring.

## **4.3 Track 2: Copy Generation**

Copy generation has the tightest guardrails. The CCO governs vocabulary, length, tone, mandatory inclusions, and exclusions. Every copy variant is channel-specific.

### **4.3.1 Copy Output Schema**

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **copy\_id** | uuid | Auto | Unique identifier for this variant. |
| **channel** | enum | Yes | Which channel this copy is for. Must be one of the campaign’s selected channels. |
| **deliverable\_type** | enum | Yes | headline | body | cta | caption | subject\_line | pre\_header. |
| **content** | string | Yes | The generated copy text. |
| **character\_count** | integer | Auto | Must be within channel\_constraints.copy\_limits for this channel \+ deliverable type. |
| **tone\_adherence** | string | Yes | Statement of how this copy reflects the effective\_tone. |
| **key\_message\_delivery** | string | Yes | How this copy serves the key\_message. Required traceability. |
| **mandatory\_inclusions\_check** | object | Auto | Checklist: {item: string, present: boolean} for each parsed\_requirement that applies to copy. |
| **exclusions\_check** | object | Auto | Checklist: {item: string, violated: boolean} for each parsed\_exclusion. |
| **legal\_disclaimers\_appended** | boolean | Auto | Whether required legal text has been included. |

### **4.3.2 Copy System Prompt Template**

ROLE: You are a senior copywriter producing brand-compliant creative copy.

BRAND VOICE:

  Descriptors: {bio.voice\_descriptors}

  Approved vocabulary: {bio.approved\_vocabulary}

  Banned phrases: {bio.banned\_phrases}

CAMPAIGN CONTEXT:

  Key message: {cco.strategic\_context.key\_message}

  Emotional register: {cco.strategic\_context.emotional\_register}

  Target audience: {cco.audience\_context.audience\_raw}

  Language register: {cco.audience\_context.language\_register}

  Vocabulary guidance: {cco.tone\_profile.vocabulary\_guidance}

  Effective tone: {cco.tone\_profile.effective\_tone}

CHANNEL RULES (for {channel\_id}):

  Max characters: {cco.channel\_constraints\[channel\].copy\_limits.max\_chars}

  Format rules: {cco.channel\_constraints\[channel\].format\_rules}

HARD CONSTRAINTS:

  Must include: {cco.hard\_constraints.parsed\_requirements}

  Must avoid: {cco.hard\_constraints.parsed\_exclusions}

  Legal disclaimers: {cco.hard\_constraints.legal\_disclaimers}

OUTPUT: Return a JSON object matching the Copy Output Schema.

Copy MUST deliver the key message.

Copy MUST stay within character limits for the target channel.

Copy MUST use the vocabulary guidance and avoid banned phrases.

Run mandatory\_inclusions\_check and exclusions\_check before returning.

### **4.3.3 Copy Validation Rules**

* character\_count exceeding copy\_limits triggers automatic truncation suggestion (not silent trimming).

* Any exclusions\_check item with violated: true blocks the copy from approval and flags it.

* Any mandatory\_inclusions\_check item with present: false triggers a warning.

* legal\_disclaimers\_appended must be true if the BIO specifies required disclaimers for this channel/industry.

* Imported copy runs through the same validation and receives a brand-voice similarity score (0–100).

* Copy with a brand-voice score below 50 triggers a “brand-tune” suggestion with specific rewrites.

## **4.4 Track 3: Image Generation**

Image generation receives the most structured prompting. The CCO constrains dimensions, colour palette, composition, mood, and style — all derived from the brief and brand.

### **4.4.1 Image Output Schema**

| Field | Type | Required | Description |
| :---- | :---- | :---- | :---- |
| **image\_id** | uuid | Auto | Unique identifier. |
| **channel** | enum | Yes | Target channel. Determines dimensions and safe zones. |
| **image\_url** | string | Auto | Generated or uploaded image storage path. |
| **dimensions** | object | Auto | Must match channel\_constraints.image\_dimensions exactly. |
| **colour\_compliance** | object | Auto | {dominant\_colours: hex\[\], bio\_palette\_match: 0–100}. Measures how well the image adheres to brand colours. |
| **composition\_check** | object | Auto | {safe\_zones\_clear: boolean, logo\_area\_available: boolean, text\_overlay\_area: boolean}. |
| **mood\_alignment** | string | Yes | Statement of how this image reflects the emotional\_register and effective\_tone. |
| **style\_adherence** | string | Yes | How this image follows the BIO photography/illustration style direction. |
| **key\_message\_support** | string | Yes | How this image visually reinforces the key\_message. |
| **exclusions\_check** | object | Auto | Visual exclusions: competitor colours, banned imagery, cliche detection. |

### **4.4.2 Image System Prompt Template**

ROLE: You are a senior art director producing brand-compliant campaign imagery.

BRAND VISUAL IDENTITY:

  Primary colours: {bio.visual\_identity.colours.primary}

  Secondary colours: {bio.visual\_identity.colours.secondary}

  Typography: {bio.visual\_identity.typography}

  Photography style: {bio.visual\_identity.photography\_style}

  Illustration style: {bio.visual\_identity.illustration\_style}

  Logo usage: {bio.visual\_identity.logo\_rules}

CAMPAIGN CONTEXT:

  Emotional register: {cco.strategic\_context.emotional\_register}

  Key message: {cco.strategic\_context.key\_message}

  Target audience: {cco.audience\_context.audience\_raw}

  Cultural context: {cco.audience\_context.cultural\_context}

  Effective tone: {cco.tone\_profile.effective\_tone}

CHANNEL SPECIFICATIONS (for {channel\_id}):

  Dimensions: {cco.channel\_constraints\[channel\].image\_dimensions}

  Safe zones: {cco.channel\_constraints\[channel\].image\_dimensions.safe\_zones}

  Content type: {cco.channel\_constraints\[channel\].content\_type}

HARD CONSTRAINTS:

  Requirements: {cco.hard\_constraints.parsed\_requirements}

  Visual exclusions: {cco.hard\_constraints.parsed\_exclusions}

REFERENCE DIRECTION:

  Positive references: {cco.reference\_assets\[classification \!= negative\].description}

  Negative references (AVOID): {cco.reference\_assets\[classification \== negative\].description}

OUTPUT: Generate an image matching the specifications above.

Image MUST use brand colours as dominant palette.

Image MUST leave safe zones clear for UI overlays.

Image MUST visually reinforce the key message.

Image MUST NOT include any visual exclusions.

### **4.4.3 Image Validation Rules**

* dimensions must exactly match the target channel’s image\_dimensions. Mismatches are auto-flagged.

* colour\_compliance.bio\_palette\_match below 40 triggers a “off-brand colour” warning.

* composition\_check.safe\_zones\_clear must be true. False blocks approval.

* Uploaded images run through the same validation pipeline. Colour extraction, composition analysis, and mood scoring apply equally.

* exclusions\_check flags images containing competitor brand colours (within a tolerance threshold) or banned visual elements.

# **5\. Brief Edit & Drift Detection**

When a user edits the Campaign Brief after assets have already been generated, the CCO is recompiled and its version number increments. Jigi must then determine which existing assets are potentially out of alignment with the new brief.

## **5.1 Drift Detection Process**

* On brief save, Jigi diffs the new CCO against the previous version.

* Changed fields are classified as high-impact (key\_message, target\_audience, channels, tone\_override) or low-impact (additional\_requirements, reference\_assets).

* All assets generated under the previous CCO version are flagged with a drift indicator visible on the “Generated” and “All Assets” tabs.

* High-impact changes flag all assets as “Review Required.” Low-impact changes flag only assets in affected tracks.

* The user can trigger a batch re-validation against the new CCO to update scores and surface specific misalignments.

## **5.2 Asset Lineage**

Every generated asset stores metadata linking it to the CCO version and BIO version active at generation time. This provides full traceability:

* asset.cco\_version — which brief version produced it.

* asset.bio\_version — which brand config was active.

* asset.generation\_timestamp — when it was created.

* asset.validation\_scores — snapshot of all compliance scores at generation time.

# **6\. Channel Constraints Library (Reference)**

Below is a sample of the built-in channel constraints Jigi maintains. These are auto-applied based on channel selection in the brief.

| Channel | Image Dims | Copy Limits | Key Rules |
| :---- | :---- | :---- | :---- |
| **Instagram Story** | 1080×1920 (9:16) | 125 chars overlay | Text in top 40%. Leave 14% bottom for swipe-up. No small text. |
| **Instagram Post** | 1080×1080 (1:1) | 2,200 chars caption | First 125 chars visible before “more.” Front-load hook. 30 hashtags max. |
| **Instagram Reel** | 1080×1920 (9:16) | 2,200 chars caption | No clickable links in caption. CTA must be verbal/visual. Safe zone: centre 80%. |
| **Facebook Post** | 1200×630 (1.91:1) | 63,206 chars (500 optimal) | First 3 lines visible. Supports link previews. Avoid text \>20% of image. |
| **Facebook Ad** | 1080×1080 or 1200×628 | 125 primary, 40 headline, 25 description | Text overlay \<20% of image area. CTA button auto-rendered by platform. |
| **Twitter/X Post** | 1600×900 (16:9) | 280 chars | Images crop to 16:9 in feed. Keep key content centred. Thread-friendly. |
| **LinkedIn Post** | 1200×1200 (1:1) | 3,000 chars | First 2 lines visible. Professional tone default. Carousel docs supported. |
| **Display Ad** | Multiple (IAB standard) | 90 chars body, 25 CTA | 300×250, 728×90, 160×600 most common. Max file size varies. |
| **Website Banner** | 1440×400 (desktop) | 50 chars headline, 120 body | Responsive variants needed. Hero image left-aligned content common. |
| **Email Header** | 600×200 (standard) | Subject: 50 chars, Pre-header: 100 | Render tested across clients. Alt text required. Dark mode safe colours. |

# **7\. Implementation Notes**

## **7.1 Brief Compiler Service**

The brief compiler is a server-side service triggered on Campaign Brief save. It performs the following steps:

* Parse objective text using a lightweight classification model to extract goal\_type and emotional\_register.

* Parse target\_audience text to extract demographic cues, psychographic traits, and infer language\_register.

* Look up channel\_constraints from the channel library for each selected channel.

* Merge BIO base\_tone with campaign tone\_override to produce effective\_tone and vocabulary\_guidance.

* Parse additional\_requirements and exclusions into structured lists.

* Classify and describe uploaded reference assets using vision model.

* Assemble and persist the CCO JSON object with version metadata.

## **7.2 Prompt Assembly Service**

A dedicated prompt assembly service reads the BIO, CCO, and track template for each generation call. It is responsible for:

* Substituting all placeholders in the track-specific system prompt template with live CCO and BIO values.

* Enforcing token budget: if the assembled prompt exceeds the model’s context window, it intelligently truncates reference\_asset descriptions and format\_rules (never key\_message or hard\_constraints).

* Logging the assembled prompt hash alongside the generated asset for audit and reproducibility.

## **7.3 Validation Pipeline**

Post-generation validation runs as a separate model call (or rule-based check where possible) that receives the generated output and the CCO/BIO, and returns the compliance scores and checklists defined in each track’s output schema. This separation ensures validation is independent of generation.

# **8\. Summary**

The Campaign Brief is the single source of strategic truth for every creative asset in a campaign. By compiling it into a structured Campaign Context Object and injecting it as system-level instructions across all three generation tracks, Jigi ensures:

* Every concept traces back to the campaign’s key message and a brand value proposition.

* Every copy variant respects channel limits, uses the right tone and vocabulary, and includes mandatory elements.

* Every image adheres to brand colours, channel dimensions, composition rules, and visual direction.

* Imported assets receive the same rigour as generated ones — validated, scored, and flagged.

* Brief edits trigger drift detection so existing assets are never silently out of alignment.

The user’s experience remains simple: fill in the brief, choose a track, generate or import. Jigi handles the rest.