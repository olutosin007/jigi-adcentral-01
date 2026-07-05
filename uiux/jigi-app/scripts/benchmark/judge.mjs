/**
 * LLM-as-judge for subjective on-brand fit (text) and visual on-brand fit
 * (image, via a vision-capable model). Uses OpenRouter directly, mirroring the
 * server's llm.ts configuration.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function brandCard(brand, brief) {
  return [
    `Brand: ${brand.name}`,
    `Positioning: ${brand.strategy?.positioning || 'n/a'}`,
    `Differentiators: ${(brand.strategy?.differentiators || []).join('; ') || 'n/a'}`,
    `Tone: ${(brand.voice.tone || []).join(', ')}`,
    `Preferred language: ${(brand.voice.preferred_words || []).join(', ')}`,
    `Avoid language: ${(brand.voice.avoided_words || []).join(', ')}`,
    `Colours: ${(brand.identity.colours || []).map((c) => `${c.role} ${c.hex}`).join(', ')}`,
    `Visual style: ${brand.visualStyle || 'n/a'}`,
    `Campaign objective: ${brief.brief.objective}`,
    `Audience: ${brief.brief.audience}`,
    `Key message: ${brief.keyMessage}`,
  ].join('\n')
}

async function callOpenRouter({ apiKey, model, messages }) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Title': 'Jigi On-Brand Benchmark',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content || '{}'
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {}
  }
}

export async function judgeText({ apiKey, model, brand, brief, concepts, copyVariants }) {
  const system =
    'You are a brutally honest brand guardian for a global CPG brand. Score how on-brand the creative is. Return strict JSON.'
  const user = `BRAND BRIEF\n${brandCard(brand, brief)}

GENERATED CONCEPTS\n${JSON.stringify(concepts, null, 2)}

GENERATED COPY\n${JSON.stringify(copyVariants, null, 2)}

Score the creative on a 0-100 scale for each dimension. Be strict: generic, off-tone, or off-strategy work should score below 60.
Return JSON exactly:
{
  "brand_fit": <0-100>,
  "tone_fit": <0-100>,
  "strategy_fit": <0-100>,
  "distinctiveness": <0-100>,
  "overall": <0-100>,
  "issues": ["short issue", ...],
  "rationale": "1-2 sentences"
}`

  return callOpenRouter({
    apiKey,
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
}

export async function judgeImage({ apiKey, model, brand, brief, imageUrl }) {
  const system =
    'You are a brand art director judging whether an ad image is on-brand. You can see the image. Return strict JSON.'
  const user = [
    {
      type: 'text',
      text: `BRAND BRIEF\n${brandCard(brand, brief)}

Judge the attached generated ad image. Be strict: a sterile/minimalist look, wrong/missing brand colours, or a generic stock feel should score low.
Return JSON exactly:
{
  "brand_fit": <0-100>,
  "color_fit": <0-100>,
  "coke_red_dominant": <true|false>,
  "aesthetic_fit": <0-100>,
  "overall": <0-100>,
  "issues": ["short issue", ...],
  "rationale": "1-2 sentences"
}`,
    },
    { type: 'image_url', image_url: { url: imageUrl } },
  ]

  return callOpenRouter({
    apiKey,
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
}
