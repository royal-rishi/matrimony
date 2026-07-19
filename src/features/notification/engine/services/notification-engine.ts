// ============================================================
// CENTRAL ENTERPRISE NOTIFICATION ENGINE FACADE
// ============================================================

import type { NotificationEventPayload, EngineResult } from '../types/engine.types'
import { NotificationFactory } from '../utils/notification-factory'
import { eventBus } from '../events/event-bus'
import { createWhatsAppService } from '../../whatsapp/services/whatsapp-service.factory'
import { previewWhatsApp } from '../../whatsapp/actions/whatsapp.actions'

export class NotificationEngine {
  private readonly orchestrator = NotificationFactory.createOrchestrator()
  private readonly scheduler = NotificationFactory.createScheduler()

  /**
   * Dispatches a notification instantly.
   * Publishes the event to the Event Bus, which routes it through the validation/dispatch pipeline.
   */
  async dispatch(payload: NotificationEventPayload): Promise<EngineResult> {
    try {
      // 1. Publish to system Event Bus
      await eventBus.publish(payload.eventType, payload)

      // 2. Process via orchestrator pipeline
      return await this.orchestrator.orchestrate(payload)
    } catch (err) {
      console.error('[NotificationEngine] Dispatch error:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown dispatch exception.',
        channelResults: [],
      }
    }
  }

  /**
   * Schedules a notification for a future date.
   */
  async schedule(payload: NotificationEventPayload, scheduledFor: Date): Promise<EngineResult> {
    return this.scheduler.schedule(payload, scheduledFor)
  }

  /**
   * Cancels a pending scheduled notification.
   */
  async cancel(notificationId: string): Promise<boolean> {
    return this.scheduler.cancel(notificationId)
  }

  /**
   * Retries a failed message manually from the queue.
   */
  async retry(whatsappQueueId: string): Promise<any> {
    const { retryWhatsApp } = require('../../whatsapp/actions/whatsapp.actions')
    return retryWhatsApp(whatsappQueueId)
  }

  /**
   * Broadcasts a notification event to multiple recipient users.
   */
  async broadcast(
    payload: Omit<NotificationEventPayload, 'userId'>,
    userIds: string[]
  ): Promise<EngineResult[]> {
    const promises = userIds.map((userId) =>
      this.dispatch({
        ...payload,
        userId,
      })
    )
    return Promise.all(promises)
  }

  /**
   * Generates a preview rendering of the templates.
   */
  async preview(
    eventType: string,
    variables: Record<string, string | number | boolean> = {}
  ): Promise<any> {
    // Falls back to WhatsApp layout visual previews mock
    return previewWhatsApp(eventType, variables)
  }
}
export const notificationEngine = new NotificationEngine();
