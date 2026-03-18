import { z } from 'zod'

export const brandColorsSchema = z.object({
  primary: z.string().min(1, 'Primary color is required'),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  neutral: z.string().optional(),
})

export const brandTypographySchema = z.object({
  heading: z.string().min(1, 'Heading font is required'),
  body: z.string().min(1, 'Body font is required'),
})

export const brandIdentitySchema = z.object({
  logo_url: z.string().url().optional().or(z.literal('')),
  colours: brandColorsSchema.optional(),
  fonts: brandTypographySchema.optional(),
})

export const brandVoiceSchema = z.object({
  tone: z.array(z.string()).min(3, 'Select at least 3 tone descriptors').max(5, 'Select at most 5 tone descriptors'),
  preferred_words: z.array(z.string()).optional(),
  avoided_words: z.array(z.string()).optional(),
  samples: z.array(z.string()).optional(),
})

export const teamInviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'approver', 'reviewer']),
})

export const onboardingSchema = z.object({
  brandName: z.string().min(2, 'Brand name must be at least 2 characters'),
  logoUrl: z.string().optional(),
  colours: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    neutral: z.string(),
  }).optional(),
  typography: z.object({
    heading: z.string(),
    body: z.string(),
  }).optional(),
  tone: z.array(z.string()).min(0).max(5),
  preferredWords: z.array(z.string()),
  avoidedWords: z.array(z.string()),
  teamInvites: z.array(teamInviteSchema).optional(),
  agencyEmail: z.string().email().optional().or(z.literal('')),
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

export const TONE_OPTIONS = [
  'Friendly',
  'Professional',
  'Playful',
  'Bold',
  'Warm',
  'Confident',
  'Minimal',
  'Luxurious',
  'Witty',
  'Authoritative',
  'Caring',
  'Edgy',
  'Innovative',
  'Trustworthy',
  'Casual',
  'Sophisticated',
] as const

export const POPULAR_FONTS = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Playfair Display',
  'Plus Jakarta Sans',
  'DM Sans',
  'Space Grotesk',
  'Lora',
  'Roboto',
  'Open Sans',
  'Source Sans Pro',
  'Nunito',
] as const

export const TEAM_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to manage brand and team' },
  { value: 'approver', label: 'Approver', description: 'Can approve or reject creative assets' },
  { value: 'reviewer', label: 'Reviewer', description: 'Can view and comment on assets' },
] as const

export const USER_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access to manage brand and team' },
  { value: 'approver', label: 'Approver', description: 'Can approve or reject creative assets' },
  { value: 'reviewer', label: 'Reviewer', description: 'Can view and comment on assets' },
  { value: 'creator', label: 'Agency Creator', description: 'Agency user; can generate and submit creatives' },
] as const
