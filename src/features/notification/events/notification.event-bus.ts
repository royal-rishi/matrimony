// ============================================================
// NOTIFICATION EVENT BUS
// A simple in-process event emitter for decoupled event dispatch.
// Other features (chat, matching, payments) publish events here
// instead of calling the NotificationService directly.
// This ensures the Notification module is optional and removable.
//
// Usage (from another feature's server action):
//   import { notificationEventBus } from '@/features/notification/events/notification.event-bus'
//   notificationEventBus.emit(MATCH_EVENTS.INTEREST_RECEIVED, { userId, templateData })
// ============================================================

import type { CreateNotificationInput } from '../types/notification.types'
import type { NotificationEventType } from '../constants/notification-events.constants'

type NotificationEventPayload = Omit<CreateNotificationInput, 'eventType'>

type EventHandler = (payload: NotificationEventPayload) => void | Promise<void>

class NotificationEventBus {
  private readonly handlers = new Map<string, EventHandler[]>()

  /**
   * Subscribe to a notification event type.
   */
  on(eventType: NotificationEventType | string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? []
    this.handlers.set(eventType, [...existing, handler])
  }

  /**
   * Unsubscribe a handler.
   */
  off(eventType: NotificationEventType | string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) ?? []
    this.handlers.set(
      eventType,
      existing.filter((h) => h !== handler)
    )
  }

  /**
   * Publish an event. All registered handlers are called concurrently.
   */
  async emit(
    eventType: NotificationEventType | string,
    payload: NotificationEventPayload
  ): Promise<void> {
    const handlers = this.handlers.get(eventType) ?? []
    await Promise.allSettled(handlers.map((h) => h(payload)))
  }

  /**
   * Clear all handlers. Useful for testing.
   */
  clear(): void {
    this.handlers.clear()
  }
}

/** Singleton event bus instance */
export const notificationEventBus = new NotificationEventBus()
