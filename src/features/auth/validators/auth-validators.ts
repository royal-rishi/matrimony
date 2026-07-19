import { z } from 'zod'

/**
 * Validator schema for the login form.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Validator schema for the registration form.
export const registerSchema = z
  .object({
    // Account details
    email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirm_password: z.string().min(6, 'Confirm password must match'),

    // Personal details
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(1, 'Last name is required'),
    gender: z.enum(['male', 'female', 'other'], {
      message: 'Please select gender',
    }),
    date_of_birth: z.string().refine((val) => {
      let parsedDate = val
      if (val.includes('-')) {
        const parts = val.split('-')
        if (parts[0] && parts[0].length === 2 && parts[2] && parts[1]) {
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      } else if (val.includes('/')) {
        const parts = val.split('/')
        if (parts[0] && parts[0].length === 2 && parts[2] && parts[1]) {
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }
      const birthDate = new Date(parsedDate)
      if (isNaN(birthDate.getTime())) return false
      
      // Matrimonial age validation (typically 18+)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age >= 18
    }, 'You must be at least 18 years old'),

    // Background details
    religion: z.string().min(2, 'Please select or enter your religion'),

    // Mobile number
    mobile_number: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'),

    // Referral code (optional)
    referral_code: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Validator schema for requesting password reset.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/**
 * Validator schema for resetting password.
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirm_password: z.string().min(6, 'Confirm password must match'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Validator schema for requesting OTP Login.
 */
export const otpRequestSchema = z.object({
  identifier: z.string().min(3, 'Please enter a valid email address or 10-digit mobile number'),
  channel: z.enum(['sms', 'whatsapp']).optional(),
}).refine((data) => {
  const isNum = /^\d+$/.test(data.identifier)
  if (isNum) {
    return /^[6-9]\d{9}$/.test(data.identifier)
  }
  return true
}, {
  message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
  path: ['identifier']
})

export type OtpRequestInput = z.infer<typeof otpRequestSchema>

/**
 * Validator schema for verifying OTP Login.
 */
export const otpVerifySchema = z.object({
  identifier: z.string().min(3, 'Please enter a valid email address or 10-digit mobile number'),
  token: z.string().length(6, 'Verification code must be exactly 6 digits'),
})

export type OtpVerifyInput = z.infer<typeof otpVerifySchema>

export const ASSOCIATE_ROLES = [
  'local_associate',
  'block_associate',
  'district_associate',
  'state_associate',
] as const

export const associateRegisterSchema = z
  .object({
    // Account details
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirm_password: z.string().min(6, 'Confirm password must match'),

    // Personal details
    first_name: z.string().min(2, 'First name must be at least 2 characters'),
    last_name: z.string().min(1, 'Last name is required'),
    mobile_number: z.string().length(10, 'Mobile number must be exactly 10 digits'),
    role: z.enum(ASSOCIATE_ROLES, {
      message: 'Please select associate level role',
    }),

    // Location / Territory details
    state: z.string().min(2, 'State is required'),
    district: z.string().min(2, 'District is required'),
    block: z.string().min(2, 'Block is required'),
    village_ward: z.string().optional(),

    // Identity verification (KYC) details
    aadhaar_number: z.string().length(12, 'Aadhaar number must be exactly 12 digits'),
    pan_number: z.string().length(10, 'PAN card number must be exactly 10 characters'),

    // Bank Information
    bank_account_number: z.string().min(8, 'Bank account number must be at least 8 digits'),
    bank_ifsc_code: z.string().refine((val) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), {
      message: 'Invalid bank IFSC code format (e.g. SBIN0012345)',
    }),
    bank_holder_name: z.string().min(3, 'Bank account holder name is required'),

    // Professional details
    experience: z.preprocess(
      (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
      z.number().int().min(0, 'Experience cannot be negative')
    ),
    occupation: z.string().min(2, 'Occupation details are required'),
    languages: z.string().min(2, 'Please list languages known (e.g. Hindi, English)'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export type AssociateRegisterInput = z.infer<typeof associateRegisterSchema>

