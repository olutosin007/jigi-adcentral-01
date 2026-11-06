/**
 * Golden brand fixture: Coca-Cola.
 *
 * Used ONLY for on-brand benchmarking (not seeded into the product). The shape
 * of `brand` matches `BrandConstraints` from src/lib/ai/types.ts so it can be
 * fed straight into the real prompt builders (buildConceptPrompt etc.).
 *
 * `visualStyle`, `keyMessage`, and `expectations` are benchmark-only extensions
 * the product schema does not yet capture — that gap is one of the things this
 * benchmark exists to measure.
 */

/** @type {import('../../src/lib/ai/types').BrandConstraints & { visualStyle: string }} */
export const cocaColaBrand = {
  name: 'Coca-Cola',
  identity: {
    colours: [
      { hex: '#F40009', role: 'primary' }, // Coca-Cola Red
      { hex: '#FFFFFF', role: 'secondary' },
      { hex: '#1E1E1E', role: 'text' },
    ],
    fonts: { heading: 'Coca-Cola Spencerian Script', body: 'Gotham' },
    logo_url: 'https://logo.clearbit.com/coca-cola.com',
    // Fix #3: the art-direction the pipeline now propagates into image prompts.
    visual_style:
      'Warm, vibrant photographic realism with Coca-Cola Red dominant. Condensation on ice-cold glass contour bottles, authentic human joy, people sharing moments. Classic yet contemporary, golden warm lighting — never sterile, cold, or minimalist-clinical.',
  },
  voice: {
    tone: ['optimistic', 'warm', 'refreshing', 'inclusive', 'timeless', 'joyful'],
    preferred_words: [
      'refreshing',
      'real magic',
      'share',
      'happiness',
      'together',
      'ice-cold',
      'enjoy',
      'classic',
    ],
    avoided_words: [
      'cheap',
      'unhealthy',
      'sugar crash',
      'artificial',
      'knockoff',
      'generic',
      'diet failure',
      'addictive',
    ],
    samples: ['Taste the Feeling.', 'Open Happiness.', 'Real Magic.'],
  },
  strategy: {
    positioning:
      'The original, timeless cola that brings people together over shared moments of happiness and ice-cold refreshment.',
    differentiators: [
      'Original 1886 recipe and secret formula',
      'Iconic contour bottle silhouette',
      'Global symbol of togetherness and optimism',
      'Unmistakable Coca-Cola Red identity',
    ],
  },
  // Benchmark-only: the visual identity the product BIO does not currently carry.
  visualStyle:
    'Warm, vibrant photographic realism with Coca-Cola Red dominant. Condensation on ice-cold glass contour bottles, authentic human joy, people sharing moments. Classic yet contemporary, golden warm lighting — never sterile, cold, or minimalist-clinical.',
}

/**
 * Brief matrix. Each entry exercises a different scenario / failure-mode risk.
 */
export const briefs = [
  {
    id: 'summer_refresh',
    label: 'Summer refreshment',
    brief: {
      objective: 'Drive summer single-serve refreshment occasions',
      audience: 'Young adults 18–30 enjoying summer outdoors',
      channels: ['meta_feed', 'instagram_story'],
      requirements: 'Highlight ice-cold refreshment and sharing with friends.',
    },
    keyMessage: 'Ice-cold Coca-Cola is the refreshment you share',
    copyFormat: 'social_post',
    channelCharLimit: 125,
    imageDescription:
      'A group of friends sharing ice-cold Coca-Cola at a sunny summer beach gathering',
  },
  {
    id: 'holiday_togetherness',
    label: 'Holiday togetherness',
    brief: {
      objective: 'Own the festive season as the drink of togetherness',
      audience: 'Families and friends celebrating the holidays',
      channels: ['meta_feed', 'youtube'],
      requirements: 'Evoke warmth, nostalgia and shared celebration.',
    },
    keyMessage: 'Share the magic of the holidays together',
    copyFormat: 'social_post',
    channelCharLimit: 125,
    imageDescription:
      'A festive holiday dinner table with family toasting using glass bottles of Coca-Cola, warm string lights',
  },
  {
    id: 'ramadan_iftar',
    label: 'Ramadan iftar (cultural)',
    brief: {
      objective: 'Be part of the iftar table during Ramadan',
      audience: 'Muslim families in the MENA region',
      channels: ['instagram_feed'],
      requirements: 'Respectful, family-centred, moment of breaking fast together.',
    },
    keyMessage: 'Share moments of togetherness at iftar',
    copyFormat: 'social_post',
    channelCharLimit: 150,
    imageDescription:
      'An iftar table at sunset with a family breaking their fast together, Coca-Cola among the dishes',
  },
  {
    id: 'genz_music',
    label: 'Gen-Z music festival (tone-drift risk)',
    brief: {
      objective: 'Make Coca-Cola the taste of festival moments for Gen Z',
      audience: 'Gen Z 16–22 at live music events',
      channels: ['tiktok'],
      requirements: 'High energy and youthful, but keep it warm and inclusive — not edgy/ironic.',
    },
    keyMessage: 'Real Magic happens at the festival',
    copyFormat: 'social_post',
    channelCharLimit: 100,
    imageDescription:
      'An energetic music festival crowd at golden hour sharing a Coca-Cola moment',
  },
]

/** Pass/fail thresholds for the on-brand rubric (0–100 scale). */
export const thresholds = {
  avoidedWordPenalty: 25, // points deducted per avoided-word hit
  conceptAlignmentMin: 75, // model-reported brand_alignment_score floor
  copyToneMin: 80, // model-reported tone_adherence floor
  compositePass: 75, // overall on-brand pass mark
  imageOnBrandPass: 75, // vision-judge on-brand floor
}
