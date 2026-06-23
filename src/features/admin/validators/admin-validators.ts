import { z } from 'zod'

// 1. User Management Validators
export const banUserSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  reason: z.string().min(4, 'Reason must be at least 4 characters long'),
  isPermanent: z.boolean().default(false),
})

export const mergeUserSchema = z.object({
  masterUserId: z.string().uuid('Invalid master user ID'),
  duplicateUserId: z.string().uuid('Invalid duplicate user ID'),
  reason: z.string().min(5, 'Reason for merge is required'),
})

// 2. Associate Management Validators
export const approveAssociateSchema = z.object({
  associateId: z.string().uuid('Invalid associate ID'),
  approved: z.boolean(),
  notes: z.string().optional(),
})

export const assignTerritorySchema = z.object({
  associateId: z.string().uuid('Invalid associate ID'),
  state: z.string().min(2, 'State is required'),
  district: z.string().optional(),
  block: z.string().optional(),
})

// 3. Verification Center Validators
export const kycVerifySchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['approved', 'rejected']),
  notes: z.string().optional(),
})

// 4. Case Management Validators
export const caseAssignSchema = z.object({
  caseId: z.string().uuid('Invalid case ID'),
  associateId: z.string().uuid('Invalid associate ID'),
  transferReason: z.string().optional(),
})

// 5. Finance Validators
export const refundApproveSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  approved: z.boolean(),
  reason: z.string().min(5, 'Reason for refund/rejection is required'),
})

export const manualAdjustCommissionSchema = z.object({
  walletTransactionId: z.string().uuid().optional(), // for adjusting existing
  associateId: z.string().uuid('Invalid associate ID'),
  amount: z.number().refine((n) => n !== 0, 'Amount cannot be zero'),
  type: z.enum(['credit', 'debit']),
  reason: z.string().min(5, 'Adjustment reason is required'),
})

// 6. Dispute Validators
export const disputeResolveSchema = z.object({
  disputeId: z.string().uuid('Invalid dispute ID'),
  resolutionNotes: z.string().min(5, 'Resolution notes are required'),
  status: z.enum(['resolved', 'dismissed']),
})

// 7. Success Story Attribution
export const recordVerificationSchema = z.object({
  successId: z.string().uuid('Invalid success ID'),
  verified: z.boolean(),
  isFeatured: z.boolean().default(false),
  notes: z.string().optional(),
})

// 8. CMS Dynamic Content Modules
export const savePageSchema = z.object({
  id: z.string().min(2, 'Page identifier is required'),
  title: z.string().min(2, 'Page title is required'),
  content: z.record(z.string(), z.any()),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogTags: z.record(z.string(), z.any()).optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
})

export const saveBlogSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new blogs
  slug: z.string().min(2, 'Slug must be at least 2 chars'),
  title: z.string().min(4, 'Title must be at least 4 chars'),
  summary: z.string().optional(),
  content: z.string().min(10, 'Content body is required'),
  featuredImage: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export const saveTemplateSchema = z.object({
  id: z.string().min(2, 'Template ID is required'),
  type: z.enum(['email', 'sms', 'push']),
  subject: z.string().optional(),
  body: z.string().min(2, 'Template body is required'),
  status: z.enum(['active', 'inactive']).default('active'),
})

// 9. Notification Broadcasts
export const broadcastNotificationSchema = z.object({
  targetSegment: z.enum(['all', 'users', 'associates', 'premium', 'free']),
  title: z.string().min(3, 'Notification title is required'),
  message: z.string().min(5, 'Message body is required'),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).min(1, 'Select at least one delivery channel'),
})
