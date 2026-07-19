// ============================================================
// CENTRAL NOTIFICATION ENGINE TYPES
// ============================================================

import type { NotificationChannel, DeliveryStatus } from '../../interfaces/notification-provider.interface'
import type { NotificationPriority } from '../../types/notification-database.types'

export interface NotificationEventPayload {
  userId: string
  eventType: string
  variables?: Record<string, string | number | boolean>
  channels?: NotificationChannel[]
  priority?: NotificationPriority
  scheduledFor?: Date
  metadata?: Record<string, any>
}

export interface EngineChannelResult {
  channel: NotificationChannel
  success: boolean
  providerMessageId?: string
  error?: string
}

export interface EngineResult {
  success: boolean
  notificationId?: string
  channelResults: EngineChannelResult[]
  error?: string
}

export interface PipelineContext {
  payload: NotificationEventPayload
  resolvedEmail?: string
  resolvedPhone?: string
  allowedChannels: NotificationChannel[]
  finalPriority: NotificationPriority
  isCancelled: boolean
  cancelReason?: string
  logs: string[]
}

export type PipelineStage = (context: PipelineContext) => Promise<PipelineContext>
export type EventBusSubscriber = (payload: NotificationEventPayload) => Promise<void>
