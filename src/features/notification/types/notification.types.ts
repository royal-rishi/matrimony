// ============================================================
// NOTIFICATION MODULE — CORE TYPES
// Single source of truth for all shapes used across the
// notification feature (actions, services, repositories, UI).
// ============================================================

import type { NotificationChannel } from '../interfaces/notification-provider.interface'

// ---- Domain Enums (as const for tree-shaking) ----

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationStatus =
  | 'pending'     // Created but not yet dispatched
  | 'dispatched'  // Handed off to the provider
  | 'delivered'   // Confirmed delivery by provider
  | 'failed'      // All retry attempts exhausted
  | 'cancelled'   // Cancelled before dispatch (e.g. user deleted account)

// ---- Core Domain Entities ----

/**
 * The persisted notification record as returned from the database.
 */
export interface UserNotification {
  id: string
  userId: string
  type: string                        // Maps to NotificationEventType
  title: string
  body: string
  actionUrl: string | null
  imageUrl: string | null
  metadata: Record<string, unknown>
  priority: NotificationPriority
  channels: NotificationChannel[]     // Which channels were used
  isRead: boolean
  readAt: string | null
  isDeleted: boolean
  deletedAt: string | null
  status: NotificationStatus
  createdAt: string
  updatedAt: string
}

// ---- Input / Command Types ----

/**
 * Input payload for creating and sending a new notification.
 * This is the DTO passed into NotificationService.createAndSend().
 */
export interface CreateNotificationInput {
  /** Target recipient user ID */
  userId: string

  /** The event type key (maps to a template and routing rules) */
  eventType: string

  /** Optional title override (falls back to template title) */
  title?: string

  /** Optional body override (falls back to rendered template) */
  body?: string

  /** Dynamic data used to populate template placeholders */
  templateData?: Record<string, string | number | boolean>

  /** Deep-link URL to navigate the user on tap/click */
  actionUrl?: string

  /** Thumbnail/avatar image URL */
  imageUrl?: string

  /** Extra metadata stored alongside the notification */
  metadata?: Record<string, unknown>

  /** Override the default priority for this event type */
  priority?: NotificationPriority

  /** Override which channels to use (defaults to user preferences + event routing) */
  channels?: NotificationChannel[]
}

/**
 * The result returned after attempting to send a notification.
 */
export interface NotificationResult {
  success: boolean
  notificationId?: string
  channelResults: ChannelResult[]
  error?: string
}

export interface ChannelResult {
  channel: NotificationChannel
  success: boolean
  externalMessageId?: string  // ID returned by the external provider (MSG91, Resend, etc.)
  error?: string
  sentAt?: string
}

// ---- Query / Filter Types ----

export interface NotificationFilters {
  isRead?: boolean
  eventType?: string
  priority?: NotificationPriority
  channel?: NotificationChannel
  page?: number         // 1-indexed
  pageSize?: number     // default: 20, max: 100
  cursor?: string       // ISO timestamp for cursor-based pagination
}

export interface PaginatedNotifications {
  data: UserNotification[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
  nextCursor?: string
}

// ---- Provider Types ----

/**
 * The normalized payload shape passed to every INotificationProvider.send().
 */
export interface NotificationPayload {
  notificationId: string
  userId: string
  recipientEmail?: string
  recipientPhone?: string
  recipientDeviceTokens?: string[]
  title: string
  body: string
  actionUrl?: string
  imageUrl?: string
  metadata?: Record<string, unknown>
  priority: NotificationPriority
}

export interface ProviderHealthStatus {
  providerId: string
  isHealthy: boolean
  latencyMs?: number
  message?: string
  checkedAt: string
}

// ---- Event Types (used in hooks & realtime subscriptions) ----

export interface NotificationRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  notification: UserNotification
}
