// ============================================================
// NOTIFICATION SERVICE
// Orchestrates: template resolution → de-duplication check →
// repository persist → provider dispatch → result aggregation.
// This is the single entry point for the entire module.
// ============================================================

import type { INotificationService } from '../interfaces/notification-service.interface'
import type { INotificationProvider } from '../interfaces/notification-provider.interface'
import type {
  CreateNotificationInput,
  NotificationFilters,
  NotificationResult,
  ChannelResult,
  PaginatedNotifications,
  UserNotification,
} from '../types/notification.types'
import type { INotificationRepository } from '../interfaces/notification-repository.interface'
import { resolveTemplate } from '../config/notification-templates.config'
import { EVENT_ROUTING_CONFIG, NOTIFICATION_CONFIG } from '../config/notification.config'
import { DEDUP_WINDOW_MS } from '../constants/notification-channels.constants'
import type { NotificationChannel } from '../interfaces/notification-provider.interface'

export class NotificationService implements INotificationService {
  constructor(
    private readonly repository: INotificationRepository,
    private readonly providers: INotificationProvider[]
  ) {}

  // ----------------------------------------------------------------
  // createAndSend
  // ----------------------------------------------------------------
  async createAndSend(input: CreateNotificationInput): Promise<NotificationResult> {
    try {
      // 1. Resolve routing config
      const routingConfig = EVENT_ROUTING_CONFIG[input.eventType]
      const targetChannels = input.channels ?? routingConfig?.channels ?? ['in_app']
      const priority = input.priority ?? routingConfig?.priority ?? 'normal'

      // 2. De-duplication check
      if (routingConfig?.deduplicatable) {
        const windowMs = routingConfig.dedupWindowMs ?? DEDUP_WINDOW_MS
        const recent = await this.repository.findByEventType(
          input.userId,
          input.eventType,
          windowMs
        )
        if (recent.length > 0) {
          if (NOTIFICATION_CONFIG.verboseLogging) {
            console.log(
              `[NotificationService] Dedup: skipping ${input.eventType} for ${input.userId}`
            )
          }
          return {
            success: true,
            notificationId: recent[0]!.id,
            channelResults: [{ channel: 'in_app', success: true }],
          }
        }
      }

      // 3. Resolve template (title + body)
      const templateKey = routingConfig?.templateKey ?? input.eventType
      const { title, body } = resolveTemplate(templateKey, input.templateData ?? {}, {
        title: input.title,
        body: input.body,
      })

      // 4. Persist to DB (Realtime delivers to subscribed clients automatically)
      const notification = await this.repository.create({
        ...input,
        title,
        body,
        priority,
        channels: targetChannels,
      })

      // 5. Dispatch through each active provider
      const channelResults = await Promise.allSettled(
        targetChannels.map(async (channel: NotificationChannel) => {
          const provider = this.providers.find(
            (p) => p.channel === channel && p.isEnabled
          )
          if (!provider) {
            return { channel, success: false, error: `No active provider for channel: ${channel}` }
          }

          const result = await provider.send({
            notificationId: notification.id,
            userId: input.userId,
            title,
            body,
            actionUrl: input.actionUrl,
            imageUrl: input.imageUrl,
            metadata: input.metadata,
            priority,
          })

          return result.channelResults[0] ?? { channel, success: false }
        })
      )

      const resolvedResults = channelResults.map(
        (r: PromiseSettledResult<ChannelResult | { channel: NotificationChannel; success: false; error?: string }>) =>
          r.status === 'fulfilled'
            ? r.value
            : { channel: 'in_app' as const, success: false as const, error: String((r as PromiseRejectedResult).reason) }
      )

      return {
        success: (resolvedResults as ChannelResult[]).some((r: ChannelResult) => r.success),
        notificationId: notification.id,
        channelResults: resolvedResults as ChannelResult[],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[NotificationService] createAndSend failed:`, message)
      return {
        success: false,
        channelResults: [{ channel: 'in_app', success: false, error: message }],
        error: message,
      }
    }
  }

  // ----------------------------------------------------------------
  // createAndSendBatch
  // ----------------------------------------------------------------
  async createAndSendBatch(inputs: CreateNotificationInput[]): Promise<NotificationResult[]> {
    const maxConcurrent = NOTIFICATION_CONFIG.maxConcurrentDispatches

    const results: NotificationResult[] = []
    for (let i = 0; i < inputs.length; i += maxConcurrent) {
      const chunk = inputs.slice(i, i + maxConcurrent)
      const chunkResults = await Promise.all(chunk.map((input) => this.createAndSend(input)))
      results.push(...chunkResults)
    }
    return results
  }

  // ----------------------------------------------------------------
  // markAsRead
  // ----------------------------------------------------------------
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.repository.markAsRead(notificationId, userId)
  }

  // ----------------------------------------------------------------
  // markAllAsRead
  // ----------------------------------------------------------------
  async markAllAsRead(userId: string): Promise<void> {
    await this.repository.markAllAsRead(userId)
  }

  // ----------------------------------------------------------------
  // deleteNotification
  // ----------------------------------------------------------------
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.repository.softDelete(notificationId, userId)
  }

  // ----------------------------------------------------------------
  // getUserNotifications
  // ----------------------------------------------------------------
  async getUserNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<PaginatedNotifications> {
    return this.repository.findByUserId(userId, filters)
  }

  // ----------------------------------------------------------------
  // getUnreadCount
  // ----------------------------------------------------------------
  async getUnreadCount(userId: string): Promise<number> {
    return this.repository.countUnread(userId)
  }

  // ----------------------------------------------------------------
  // getById
  // ----------------------------------------------------------------
  async getById(notificationId: string): Promise<UserNotification | null> {
    return this.repository.findById(notificationId)
  }
}
