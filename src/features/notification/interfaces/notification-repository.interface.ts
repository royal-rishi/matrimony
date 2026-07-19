// ============================================================
// NOTIFICATION REPOSITORY INTERFACE
// Data-access abstraction. The service layer calls this; the
// concrete SupabaseNotificationRepository implements it.
// This keeps business logic independent of the ORM/database driver.
// ============================================================

import type {
  CreateNotificationInput,
  NotificationFilters,
  PaginatedNotifications,
  UserNotification,
} from '../types/notification.types'

export interface INotificationRepository {
  // ---- Write ----

  /**
   * Persist a new notification record to the database.
   * Returns the created notification with its generated ID.
   */
  create(input: CreateNotificationInput): Promise<UserNotification>

  /**
   * Insert multiple notifications in a single database transaction.
   */
  createMany(inputs: CreateNotificationInput[]): Promise<UserNotification[]>

  /**
   * Mark a single notification as read.
   */
  markAsRead(notificationId: string, userId: string): Promise<void>

  /**
   * Mark all unread notifications for a user as read.
   */
  markAllAsRead(userId: string): Promise<void>

  /**
   * Soft-delete a notification (sets is_deleted = true).
   */
  softDelete(notificationId: string, userId: string): Promise<void>

  /**
   * Update the delivery status for a notification on a specific channel.
   */
  updateDeliveryStatus(
    notificationId: string,
    channel: string,
    status: string,
    externalMessageId?: string
  ): Promise<void>

  // ---- Read ----

  /**
   * Fetch paginated notifications for a user.
   */
  findByUserId(
    userId: string,
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications>

  /**
   * Count unread notifications for a user.
   */
  countUnread(userId: string): Promise<number>

  /**
   * Find a single notification by its primary key.
   */
  findById(notificationId: string): Promise<UserNotification | null>

  /**
   * Find notifications by event type (used for analytics & de-duplication).
   */
  findByEventType(
    userId: string,
    eventType: string,
    sinceMs?: number
  ): Promise<UserNotification[]>
}
