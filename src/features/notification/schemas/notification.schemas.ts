// ============================================================
// NOTIFICATION INPUT SCHEMAS (Zod)
// Runtime validation for all inputs entering the notification
// module boundary (Server Actions, API Routes).
// ============================================================

import { z } from 'zod'

const notificationChannelSchema = z.enum([
  'in_app',
  'email',
  'sms',
  'push',
  'whatsapp',
])

const notificationPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent'])

// ---- Core Input Schema ----

export const createNotificationSchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  eventType: z.string().min(1, 'eventType is required'),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(2000).optional(),
  templateData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  actionUrl: z.string().url('actionUrl must be a valid URL').optional(),
  imageUrl: z.string().url('imageUrl must be a valid URL').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  priority: notificationPrioritySchema.optional(),
  channels: z.array(notificationChannelSchema).min(1).optional(),
})

export type CreateNotificationSchema = z.infer<typeof createNotificationSchema>

// ---- Batch Schema ----

export const createNotificationBatchSchema = z.object({
  notifications: z
    .array(createNotificationSchema)
    .min(1, 'At least one notification is required')
    .max(500, 'Batch size cannot exceed 500'),
})

export type CreateNotificationBatchSchema = z.infer<typeof createNotificationBatchSchema>

// ---- Mark Read Schema ----

export const markAsReadSchema = z.object({
  notificationId: z.string().uuid('notificationId must be a valid UUID'),
})

export type MarkAsReadSchema = z.infer<typeof markAsReadSchema>

// ---- Filters Schema ----

export const notificationFiltersSchema = z.object({
  isRead: z.boolean().optional(),
  eventType: z.string().optional(),
  priority: notificationPrioritySchema.optional(),
  channel: notificationChannelSchema.optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export type NotificationFiltersSchema = z.infer<typeof notificationFiltersSchema>

// ---- User Preference Schema ----

const channelPreferenceSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
  push: z.boolean().default(false),
})

export const updateNotificationPreferencesSchema = z.object({
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  whatsappEnabled: z.boolean().optional(),
  quietHoursStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format')
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format')
    .nullable()
    .optional(),
  eventPreferences: z.record(z.string(), channelPreferenceSchema).optional(),
})

export type UpdateNotificationPreferencesSchema = z.infer<
  typeof updateNotificationPreferencesSchema
>
