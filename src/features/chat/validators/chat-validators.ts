import { z } from 'zod'

// ---- Send Message Schema ----
const MESSAGE_TYPES = ['text', 'image', 'document', 'emoji', 'system_message', 'voice_message', 'video_message'] as const

export const sendMessageSchema = z.object({
  roomId: z.string().uuid('Invalid room ID.'),
  content: z.string().min(1, 'Message cannot be empty.').max(4000, 'Message too long (max 4000 characters).'),
  messageType: z.enum(MESSAGE_TYPES).default('text'),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

// ---- Create Chat Room Schema ----
const CHAT_ROOM_TYPES = ['user_to_user', 'user_to_associate', 'associate_to_admin'] as const

export const createChatRoomSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient profile ID.'),
  type: z.enum(CHAT_ROOM_TYPES).default('user_to_user'),
})

export type CreateChatRoomInput = z.infer<typeof createChatRoomSchema>

// ---- Report User Schema ----
const REPORT_REASONS = ['spam', 'abuse', 'harassment', 'fake_profile', 'inappropriate_content', 'scam'] as const

export const reportUserSchema = z.object({
  reportedId: z.string().uuid('Invalid reported profile ID.'),
  roomId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  messageCreatedAt: z.string().optional(),
  reason: z.enum(REPORT_REASONS),
  description: z.string().max(1000, 'Description must be under 1000 characters.').optional(),
})

export type ReportUserInput = z.infer<typeof reportUserSchema>

// ---- Block User Schema ----
export const blockUserSchema = z.object({
  targetUserId: z.string().uuid('Invalid target user ID.'),
})

export type BlockUserInput = z.infer<typeof blockUserSchema>

// ---- Chat Settings Schema ----
export const chatSettingsSchema = z.object({
  hide_online_status: z.boolean().default(false),
  hide_last_seen: z.boolean().default(false),
  restrict_media_download: z.boolean().default(false),
})

export type ChatSettingsInput = z.infer<typeof chatSettingsSchema>

// ---- Mark Read Schema ----
export const markReadSchema = z.object({
  roomId: z.string().uuid('Invalid room ID.'),
})

export type MarkReadInput = z.infer<typeof markReadSchema>

// ---- Recall Message Schema ----
export const recallMessageSchema = z.object({
  messageId: z.string().uuid('Invalid message ID.'),
})

export type RecallMessageInput = z.infer<typeof recallMessageSchema>

// ---- Toggle Archive Schema ----
export const toggleArchiveSchema = z.object({
  roomId: z.string().uuid('Invalid room ID.'),
  archive: z.boolean(),
})

export type ToggleArchiveInput = z.infer<typeof toggleArchiveSchema>
