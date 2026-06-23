import { z } from 'zod'

export const withdrawalRequestSchema = z.object({
  bankAccountId: z.string().uuid({ message: 'Invalid Bank Account ID' }),
  amount: z.number().min(100, { message: 'Minimum withdrawal amount is ₹100' }),
  notes: z.string().optional(),
})

export const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2, { message: 'Account holder name is too short' }),
  bankName: z.string().min(2, { message: 'Bank name is too short' }),
  accountNumber: z.string().min(8, { message: 'Account number must be at least 8 digits' }),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: 'Invalid IFSC code format (e.g., SBIN0012345)',
  }),
})
