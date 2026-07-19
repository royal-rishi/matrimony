// ============================================================
// WHATSAPP DATA TYPES & DTOs
// ============================================================

import type { NotificationPriority } from '../../types/notification-database.types'

export type WhatsAppMediaType = 'image' | 'video' | 'document'

export type WhatsAppDeliveryStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'scheduled'

export interface WhatsAppButton {
  index: string
  type: 'url' | 'quick_reply'
  text: string // parameter text or payload key
}

export interface WhatsAppPayload {
  toPhone: string
  templateName: string
  language?: string
  variables?: Record<string, string | number | boolean>
  mediaUrl?: string
  mediaType?: WhatsAppMediaType
  buttons?: WhatsAppButton[]
  priority?: NotificationPriority
}

export interface WhatsAppProviderResult {
  success: boolean
  providerMessageId?: string
  providerResponse?: any
  error?: string
}

export interface WhatsAppSendResult {
  success: boolean
  whatsappQueueId?: string
  providerMessageId?: string
  status: WhatsAppDeliveryStatus
  error?: string
}

export interface WhatsAppTemplateSchema {
  templateName: string
  variablesMapping: string[] // List of keys in order: {{1}}, {{2}}, etc.
  mediaType?: WhatsAppMediaType
  buttonVariablesMapping?: {
    index: number // Button index (e.g. 0)
    type: 'url' | 'quick_reply'
    valueKey: string // Variable key to bind to button parameter
  }[]
}
