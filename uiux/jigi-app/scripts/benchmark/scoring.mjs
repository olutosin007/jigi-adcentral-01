/**
 * Deterministic, model-free scorers for on-brand benchmarking.
 *
 * These mirror the rules enforced by the product validators
 * (concept-enforcement / copy-enforcement) but are reimplemented here so the
 * benchmark stays a self-contained, independent measurement of pipeline output.
 */

function normalize(text) {
  return String(text ?? '').toLowerCase()
}

/** Word-ish match: case-insensitive substring on normalized text. */
function containsTerm(haystack, term) {
  const t = normalize(term).trim()
  if (!t) return false
  return normalize(haystack).includes(t)
}

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n))
}

/** Collect every string field of a concept into one searchable blob. */
function conceptText(c) {
  return [
    c.theme,
    c.concept_name,
    ...(c.headlines || []),
    c.visual_direction,
    c.rationale,
    c.strategic_insight,
    c.creative_territory,
    c.headline_direction,
    c.key_message_link,
  ]
    .filter(Boolean)
    .join(' \n ')
}

function copyText(v) {
  const content = v.content || v
  return [content.headline, content.body, content.cta, content.primary_text, v.primary_text]
    .filter(Boolean)
    .join(' \n ')
}

export function scoreConcept(concept, brand, brief, thresholds) {
  const text = conceptText(concept)
  const avoidedHits = (brand.voice.avoided_words || []).filter((w) => containsTerm(text, w))
  const preferredHits = (brand.voice.preferred_words || []).filter((w) => containsTerm(text, w))
  const keyTerms = brief.keyMessage.split(/\s+/).filter((w) => w.length > 3)
  const keyMessagePresent = keyTerms.some((w) => containsTerm(text, w))
  const modelAlignment =
    typeof concept.brand_alignment_score === 'number' ? concept.brand_alignment_score : null

  let score = 100
  score -= avoidedHits.length * thresholds.avoidedWordPenalty
  if (!preferredHits.length) score -= 15
  if (!keyMessagePresent) score -= 15
  if (modelAlignment != null) score = Math.round((score + modelAlignment) / 2)

  return {
    avoidedHits,
    preferredHits,
    keyMessagePresent,
    modelAlignment,
    score: clamp(score),
  }
}

export function scoreCopyVariant(variant, brand, brief, thresholds) {
  const text = copyText(variant)
  const content = variant.content || variant
  const avoidedHits = (brand.voice.avoided_words || []).filter((w) => containsTerm(text, w))
  const preferredHits = (brand.voice.preferred_words || []).filter((w) => containsTerm(text, w))
  const charCount =
    typeof content.character_count === 'number'
      ? content.character_count
      : [content.headline, content.body, content.cta].filter(Boolean).join(' ').length
  const overBy = Math.max(0, charCount - brief.channelCharLimit)
  const withinLimit = overBy === 0
  const modelTone =
    typeof content.tone_adherence === 'number'
      ? content.tone_adherence
      : typeof variant.tone_adherence === 'number'
        ? variant.tone_adherence
        : null

  // Graded length penalty: a ~10% tolerance (LLMs count chars imprecisely),
  // then scales with overage so a near-miss beats a gross overrun.
  const tolerance = Math.ceil(brief.channelCharLimit * 0.1)
  const charPenalty =
    overBy > tolerance ? Math.min(30, Math.round(((overBy - tolerance) / brief.channelCharLimit) * 60)) : 0

  let score = 100
  score -= avoidedHits.length * thresholds.avoidedWordPenalty
  if (!preferredHits.length) score -= 15
  score -= charPenalty
  if (modelTone != null) score = Math.round((score + modelTone) / 2)

  return {
    avoidedHits,
    preferredHits,
    charCount,
    channelCharLimit: brief.channelCharLimit,
    withinLimit,
    overBy,
    charPenalty,
    modelTone,
    score: clamp(score),
  }
}

export function aggregate(scores) {
  if (!scores.length) return 0
  return Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length)
}

/**
 * Composite on-brand score for one brief.
 * Weights: image 40% (visual identity is the hardest gap), concept 30%, copy 30%.
 */
export function compositeOnBrand({ conceptScore, copyScore, imageScore }) {
  const parts = []
  if (imageScore != null) parts.push({ w: 0.4, v: imageScore })
  if (conceptScore != null) parts.push({ w: 0.3, v: conceptScore })
  if (copyScore != null) parts.push({ w: 0.3, v: copyScore })
  if (!parts.length) return 0
  const totalW = parts.reduce((s, p) => s + p.w, 0)
  return Math.round(parts.reduce((s, p) => s + p.w * p.v, 0) / totalW)
}
