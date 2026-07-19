// ============================================================
// NOTIFICATION SERVICE INTERFACE
// Defines the public API surface for the NotificationService.
// Consumers depend on this abstraction, not the concrete implementation.
// ============================================================

import type {
  CreateNotificationInput,
  NotificationFilters,
  NotificationResult,
  PaginatedNotifications,
  UserNotification,
} from '../types/notification.types'

/**
 * Primary service interface for creating, delivering, and managing notifications.
 * Injected via DI into actions, hooks, and API route handlers.
 */
export interface INotificationService {
  // ---- Write Operations ----

  /**
   * Create and dispatch a notification through all configured channels.
   * This is the main entry point for the entire module.
   */
  createAndSend(input: CreateNotificationInput): Promise<NotificationResult>

  /**
   * Create and dispatch a batch of notifications.
   * Used for bulk operations (e.g. system-wide announcements).
   */
  createAndSendBatch(inputs: CreateNotificationInput[]): Promise<NotificationResult[]>

  /**
   * Mark a specific notification as read by the recipient.
   */
  markAsRead(notificationId: string, userId: string): Promise<void>

  /**
   * Mark ALL unread notifications for a user as read.
   */
  markAllAsRead(userId: string): Promise<void>

  /**
   * Soft-delete a notification for a specific user.
   */
  deleteNotification(notificationId: string, userId: string): Promise<void>

  // ---- Read Operations ----

  /**
   * Fetch paginated notifications for a user with optional filters.
   */
  getUserNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications>

  /**
   * Get the count of unread notifications for a user.
   * Used for the bell-icon badge.
   */
  getUnreadCount(userId: string): Promise<number>

  /**
   * Fetch a single notification by ID.
   */
  getById(notificationId: string): Promise<UserNotification | null>
}

/**
 * Interface for the notification preference service.
 * Allows users to control which channels they receive notifications on.
 */
export interface INotificationPreferenceService {
  getPreferences(userId: string): Promise<NotificationPreferences>
  updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences>
  isChannelEnabled(userId: string, channel: string, eventType: string): Promise<boolean>
}

export interface NotificationPreferences {
  userId: string
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  whatsappEnabled: boolean
  quietHoursStart: string | null  // e.g. '22:00'
  quietHoursEnd: string | null    // e.g. '08:00'
  eventPreferences: Record<string, ChannelPreference>
}

export interface ChannelPreference {
  inApp: boolean
  email: boolean
  sms: boolean
  push: boolean
}
