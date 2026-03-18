/**
 * Channel Constraints Library
 * Built-in catalog of channel specs for CCO assembly.
 * PRD: 03-prd-ctxt-channel-library
 * @see docs/05 mvp-cleanup/02-campaign-context-enforcement/Jigi_Campaign_Context_Object_Spec_v1.docx.md §6
 */

import type { ChannelConstraint } from '@/lib/cco'

export const CHANNEL_CONSTRAINTS_LIBRARY: Record<string, Omit<ChannelConstraint, 'channel_id'>> = {
  // ─── Social ───────────────────────────────────────────────────────────────

  instagram_story: {
    image_dimensions: {
      width: 1080,
      height: 1920,
      aspect_ratio: '9:16',
      safe_zones: {
        text_area: 'top 40%',
        swipe_up_zone: 'bottom 14%',
      },
    },
    copy_limits: {
      overlay_max: 125,
      caption_max: 2200,
    },
    format_rules: [
      'Text overlay must be in top 40%',
      'Leave 14% bottom for swipe-up',
      'No small text',
    ],
    content_type: 'static_image',
  },

  instagram_post: {
    image_dimensions: {
      width: 1080,
      height: 1080,
      aspect_ratio: '1:1',
      safe_zones: {
        visible_preview: 'first 125 chars',
      },
    },
    copy_limits: {
      caption_max: 2200,
      visible_chars: 125,
      hashtags_max: 30,
    },
    format_rules: [
      'First 125 chars visible before "more"',
      'Front-load hook',
      '30 hashtags max',
    ],
    content_type: 'static_image',
  },

  instagram_reel: {
    image_dimensions: {
      width: 1080,
      height: 1920,
      aspect_ratio: '9:16',
      safe_zones: {
        centre: '80%',
      },
    },
    copy_limits: {
      caption_max: 2200,
    },
    format_rules: [
      'No clickable links in caption',
      'CTA must be verbal/visual',
      'Safe zone: centre 80%',
    ],
    content_type: 'video',
  },

  facebook_post: {
    image_dimensions: {
      width: 1200,
      height: 630,
      aspect_ratio: '1.91:1',
      safe_zones: {
        text_avoid: 'keep under 20% of image',
      },
    },
    copy_limits: {
      max_chars: 63206,
      optimal_chars: 500,
      visible_lines: 3,
    },
    format_rules: [
      'First 3 lines visible',
      'Supports link previews',
      'Avoid text >20% of image',
    ],
    content_type: 'static_image',
  },

  facebook_ad: {
    image_dimensions: {
      width: 1080,
      height: 1080,
      aspect_ratio: '1:1',
      alternate_sizes: [{ width: 1200, height: 628 }],
      safe_zones: {
        text_overlay_max: '20% of image area',
      },
    },
    copy_limits: {
      primary_max: 125,
      headline_max: 40,
      description_max: 25,
    },
    format_rules: [
      'Text overlay <20% of image area',
      'CTA button auto-rendered by platform',
    ],
    content_type: 'static_image',
  },

  twitter_post: {
    image_dimensions: {
      width: 1600,
      height: 900,
      aspect_ratio: '16:9',
      safe_zones: {
        crop: '16:9 in feed',
      },
    },
    copy_limits: {
      max_chars: 280,
    },
    format_rules: [
      'Images crop to 16:9 in feed',
      'Keep key content centred',
      'Thread-friendly',
    ],
    content_type: 'static_image',
  },

  linkedin_post: {
    image_dimensions: {
      width: 1200,
      height: 1200,
      aspect_ratio: '1:1',
      safe_zones: {
        visible_lines: 2,
      },
    },
    copy_limits: {
      max_chars: 3000,
      visible_lines: 2,
    },
    format_rules: [
      'First 2 lines visible',
      'Professional tone default',
      'Carousel docs supported',
    ],
    content_type: 'mixed',
  },

  // ─── Display & Web ────────────────────────────────────────────────────────

  display_ad: {
    image_dimensions: {
      width: 300,
      height: 250,
      aspect_ratio: '6:5',
      alternate_sizes: [
        { width: 728, height: 90 },
        { width: 160, height: 600 },
      ],
    },
    copy_limits: {
      body_max: 90,
      cta_max: 25,
    },
    format_rules: [
      'IAB standard sizes: 300×250, 728×90, 160×600 most common',
      'Max file size varies by placement',
    ],
    content_type: 'static_image',
  },

  website_banner: {
    image_dimensions: {
      width: 1440,
      height: 400,
      aspect_ratio: '3.6:1',
      safe_zones: {
        content_alignment: 'left-aligned common',
      },
    },
    copy_limits: {
      headline_max: 50,
      body_max: 120,
    },
    format_rules: [
      'Responsive variants needed',
      'Hero image left-aligned content common',
    ],
    content_type: 'static_image',
  },

  // ─── Email ────────────────────────────────────────────────────────────────

  email_header: {
    image_dimensions: {
      width: 600,
      height: 200,
      aspect_ratio: '3:1',
      safe_zones: {
        dark_mode: 'use safe colours',
      },
    },
    copy_limits: {
      subject_max: 50,
      pre_header_max: 100,
    },
    format_rules: [
      'Render tested across clients',
      'Alt text required',
      'Dark mode safe colours',
    ],
    content_type: 'static_image',
  },

  // ─── Fallback ─────────────────────────────────────────────────────────────

  other: {
    image_dimensions: {
      width: 1080,
      height: 1080,
      aspect_ratio: '1:1',
    },
    copy_limits: {
      max_chars: 500,
      headline_max: 60,
      cta_max: 25,
    },
    format_rules: ['Custom channel – apply general best practices'],
    content_type: 'mixed',
  },
}
