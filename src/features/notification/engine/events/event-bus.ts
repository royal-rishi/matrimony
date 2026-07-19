// ============================================================
// PUB/SUB EVENT BUS (Observer Pattern)
// ============================================================

import type { NotificationEventPayload, EventBusSubscriber } from '../types/engine.types'

export class EventBus {
  private static instance: EventBus
  private subscribers: Map<string, Set<EventBusSubscriber>> = new Map()

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance;
  }

  /**
   * Subscribes a handler to a specific notification event type (or '*' for all events).
   */
  subscribe(eventType: string, callback: EventBusSubscriber): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType)!.add(callback)
  }

  /**
   * Unsubscribes a handler.
   */
  unsubscribe(eventType: string, callback: EventBusSubscriber): void {
    const handlers = this.subscribers.get(eventType)
    if (handlers) {
      handlers.delete(callback)
    }
  }

  /**
   * Publishes a notification event payload to all registered subscribers.
   */
  async publish(eventType: string, payload: NotificationEventPayload): Promise<void> {
    const handlers = this.subscribers.get(eventType)
    const wildcardHandlers = this.subscribers.get('*')

    const allPromises: Promise<void>[] = []

    if (handlers) {
      for (const cb of handlers) {
        allPromises.push(
          Promise.resolve(cb(payload)).catch((err) => {
            console.error(`[EventBus] Handler error for event '${eventType}':`, err)
          })
        )
      }
    }

    if (wildcardHandlers) {
      for (const cb of wildcardHandlers) {
        allPromises.push(
          Promise.resolve(cb(payload)).catch((err) => {
            console.error(`[EventBus] Wildcard handler error for event '${eventType}':`, err)
          })
        )
      }
    }

    await Promise.all(allPromises)
  }
}
export const eventBus = EventBus.getInstance();
