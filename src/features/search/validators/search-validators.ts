import { z } from 'zod'

/**
 * Zod validation schema for matrimonial profile search filters.
 */
export const searchFilterSchema = z.object({
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Please select a valid search gender preference.',
  }),
  ageMin: z.coerce
    .number()
    .min(18, 'Minimum age is 18')
    .max(70, 'Maximum age is 70')
    .default(18),
  ageMax: z.coerce
    .number()
    .min(18, 'Minimum age is 18')
    .max(70, 'Maximum age is 70')
    .default(50),
  religion: z.string().optional().nullable(),
  caste: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  incomeMin: z.coerce
    .number()
    .min(0, 'Income must be a positive number')
    .optional()
    .nullable()
    .default(0),
  incomeMax: z.coerce
    .number()
    .min(0, 'Income must be a positive number')
    .optional()
    .nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  isVerified: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ).default(false),
  isPremium: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().optional()
  ).default(false),
  page: z.coerce
    .number()
    .min(1)
    .default(1),
}).refine((data) => data.ageMax >= data.ageMin, {
  message: 'Maximum age must be greater than or equal to minimum age',
  path: ['ageMax'],
})

export type SearchFilterInput = z.input<typeof searchFilterSchema>
export type SearchFilterOutput = z.output<typeof searchFilterSchema>
