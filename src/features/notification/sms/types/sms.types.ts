// ============================================================
// SMS TYPES
// ============================================================

import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'

export interface SmsPayload {
  toPhone: string
  body: string
  dltTemplateId?: string
  senderId?: string
  priority?: NotificationPriority
  templateVariables?: Record<string, string | number | boolean>
  metadata?: Record<string, any>
  scheduledFor?: Date
}

export interface SmsProviderResult {
  success: boolean
  providerMessageId?: string
  providerResponse?: any
  error?: string
}

export type SmsDeliveryStatus =
  | 'queued'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'scheduled'

export interface SmsSendResult {
  success: boolean
  smsQueueId?: string
  providerMessageId?: string
  status: SmsDeliveryStatus
  error?: string
}

export interface SmsTemplate {
  id: string
  name: string
  slug: string
  body: string
  dltTemplateId: string
  senderId: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  version: number
  variables: string[]
}

export interface SmsPreference {
  smsEnabled: boolean
  marketingEnabled: boolean
  securityEnabled: boolean
  paymentEnabled: boolean
  associateEnabled: boolean
}
