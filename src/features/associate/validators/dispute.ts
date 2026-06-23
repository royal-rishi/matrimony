import { z } from 'zod'

export const DISPUTE_TYPES = [
  'poor_service',
  'no_response',
  'wrong_suggestions',
  'abusive_behaviour',
  'commission_fraud',
] as const

export const respondToDisputeSchema = z.object({
  disputeId: z.string().uuid({ message: 'Invalid Dispute ID' }),
  resolutionNotes: z.string().min(10, { message: 'Resolution notes must explain response (min 10 chars)' }),
})

export const escalateDisputeSchema = z.object({
  disputeId: z.string().uuid({ message: 'Invalid Dispute ID' }),
  escalatedTo: z.string().uuid({ message: 'Invalid Admin/SuperAdmin ID' }),
  notes: z.string().optional(),
})
