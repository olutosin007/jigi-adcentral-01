/**
 * Invented brand fixture: "Ìtàn" — an artisanal West-African hot sauce.
 *
 * Purpose: a DELIBERATELY non-famous brand whose identity is bold, rustic and
 * earthy — the opposite of "modern and clean". A model cannot lean on prior
 * knowledge (there is none), so on-brand scores reflect what the pipeline
 * actually injects. This is the honest test for Fix #3 (visual_style in the
 * prompt + dropping the hardcoded aesthetic).
 *
 * Shape matches `BrandConstraints` (src/lib/ai/types.ts) plus benchmark-only
 * `visualStyle` (for the judge card), mirroring coca-cola.fixture.mjs.
 *
 * @type {import('../../src/lib/ai/types').BrandConstraints & { visualStyle: string }}
 */
export const inventedBrand = {
  name: 'Ìtàn',
  identity: {
    colours: [
      { hex: '#B71C1C', role: 'primary' }, // deep chili red
      { hex: '#F5A623', role: 'secondary' }, // saffron
      { hex: '#241C1C', role: 'text' }, // charcoal
    ],
    fonts: { heading: 'Recoleta', body: 'Work Sans' },
    logo_url: undefined,
    visual_style:
      'Bold, hand-painted West-African market aesthetic. Rustic wooden stalls, clay bowls and kraft textures, warm terracotta and deep chili-red palette, sun-drenched natural light, real produce with honest imperfections. Vibrant, earthy and characterful — never sleek, minimalist, monochrome, or corporate-clean.',
  },
  voice: {
    tone: ['bold', 'earthy', 'proud', 'characterful', 'warm'],
    preferred_words: [
      'fiery',
      'handmade',
      'heritage',
      'bold',
      'slow-cooked',
      'market-fresh',
      'story',
    ],
    avoided_words: [
      'bland',
      'mass-produced',
      'artificial',
      'boring',
      'generic',
      'sterile',
      'sleek',
    ],
    samples: ['Every drop tells a story.', 'Heat with heritage.', 'Made by hand, not by machine.'],
  },
  strategy: {
    positioning:
      'A small-batch artisanal hot sauce that celebrates West-African flavour and story, hand-blended for people who cook with soul.',
    differentiators: [
      'Hand-blended in small batches',
      'Heritage scotch-bonnet recipe',
      'A story printed on every label',
      'No artificial anything',
    ],
  },
  visualStyle:
    'Bold, hand-painted West-African market aesthetic. Rustic wooden stalls, clay bowls and kraft textures, warm terracotta and deep chili-red palette, sun-drenched natural light, real produce with honest imperfections. Vibrant, earthy and characterful — never sleek, minimalist, monochrome, or corporate-clean.',
}

/** Brief matrix for the invented brand. */
export const briefs = [
  {
    id: 'flagship_launch',
    label: 'Flagship launch',
    brief: {
      objective: 'Launch the flagship scotch-bonnet hot sauce',
      audience: 'Adventurous home cooks 25–40 who value craft food',
      channels: ['meta_feed', 'instagram_story'],
      requirements: 'Highlight the handmade heritage and bold, honest heat.',
    },
    keyMessage: 'Heat with heritage, in every jar',
    copyFormat: 'social_post',
    channelCharLimit: 125,
    imageDescription:
      'A rustic wooden market table with a jar of Ìtàn hot sauce beside fresh scotch-bonnet peppers in warm sunlight',
  },
  {
    id: 'festive_gifting',
    label: 'Festive gifting',
    brief: {
      objective: 'Own festive gifting for food lovers',
      audience: 'Foodies buying gifts for friends and family',
      channels: ['instagram_feed'],
      requirements: 'Warm, celebratory and gift-worthy — feel handmade, not slick.',
    },
    keyMessage: 'Give the gift of bold flavour',
    copyFormat: 'social_post',
    channelCharLimit: 150,
    imageDescription:
      'A festive gift set of Ìtàn hot sauces wrapped in kraft paper and twine on a warm wooden table',
  },
]
