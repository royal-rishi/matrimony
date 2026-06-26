import { z } from 'zod'

/**
 * Zod validation schema for profile editing.
 */
export const profileEditSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(1, 'Last name is required'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a gender',
  }),
  date_of_birth: z.string().refine((val) => {
    const birthDate = new Date(val)
    if (isNaN(birthDate.getTime())) return false
    
    // Enforce 18+ age constraint
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 18
  }, 'You must be at least 18 years old'),
  marital_status: z.enum(
    ['unmarried', 'divorced', 'widowed', 'awaiting_divorce'],
    { message: 'Please select marital status' }
  ),
  religion: z.string().min(2, 'Please select or enter your religion'),
  caste: z.string().optional().nullable(),
  mother_tongue: z.string().min(2, 'Please select or enter your mother tongue'),
  education: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  annual_income: z
    .string()
    .transform((val) => (val === '' ? null : parseFloat(val)))
    .refine((val) => val === null || (!isNaN(val) && val >= 0), {
      message: 'Annual income must be a positive number',
    })
    .nullable(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().default('India'),
})

export type ProfileEditInput = z.input<typeof profileEditSchema>
export type ProfileEditOutput = z.output<typeof profileEditSchema>

/**
 * Zod validation schema for partner preferences.
 */
export const partnerPreferencesSchema = z.object({
  ageMin: z
    .number({ message: 'Minimum age is required' })
    .min(18, 'Minimum age must be at least 18')
    .max(70, 'Minimum age must be at most 70'),
  ageMax: z
    .number({ message: 'Maximum age is required' })
    .min(18, 'Maximum age must be at least 18')
    .max(70, 'Maximum age must be at most 70'),
  maritalStatus: z.array(z.string()),
  religion: z.string().optional().nullable(),
  motherTongue: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
}).refine((data) => data.ageMax >= data.ageMin, {
  message: 'Maximum age must be greater than or equal to minimum age',
  path: ['ageMax'],
})

export type PartnerPreferencesInput = z.input<typeof partnerPreferencesSchema>
export type PartnerPreferencesOutput = z.output<typeof partnerPreferencesSchema>

/**
 * Zod validation schema for profile privacy controls.
 */
export const privacyControlsSchema = z.object({
  photo_privacy_tier: z.enum(['public', 'verified_members', 'connections'], {
    message: 'Please select a valid privacy tier',
  }),
  last_name_privacy: z.boolean(),
})

export type PrivacyControlsInput = z.infer<typeof privacyControlsSchema>
