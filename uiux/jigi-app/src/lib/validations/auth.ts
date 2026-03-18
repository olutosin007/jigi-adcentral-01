import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
})

export type SignupFormData = z.infer<typeof signupSchema>

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>

export const organisationSetupSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisation name is required')
    .min(2, 'Organisation name must be at least 2 characters'),
  type: z.enum(['brand', 'agency'], {
    required_error: 'Please select your organisation type',
  }),
  industry: z.string().optional(),
})

export type OrganisationSetupFormData = z.infer<typeof organisationSetupSchema>

export const journeyChoiceSchema = z.object({
  journeyMode: z.enum(['brand_first', 'idea_first'], {
    required_error: 'Please select how you want to start',
  }),
})

export type JourneyChoiceFormData = z.infer<typeof journeyChoiceSchema>
