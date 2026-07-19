// ============================================================
// EMAIL MODULE DATA TYPES & DTOs
// ============================================================

import type { NotificationPriority } from '../../types/notification-database.types'

export type EmailTheme = 'light' | 'dark' | 'brand' | 'auto'

export interface EmailAttachment {
  filename: string
  content: string // Base64 encoded string
  contentType: string
  cid?: string // Content-ID for inline images (optional)
}

export interface EmailPayload {
  toEmail: string
  toName?: string
  subject: string
  htmlBody: string
  textBody?: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
  priority?: NotificationPriority
  attachments?: EmailAttachment[]
  headers?: Record<string, string>
  tags?: string[]
  templateId?: string
  variables?: Record<string, any>
}

export interface EmailProviderResult {
  success: boolean
  providerMessageId?: string
  providerResponse?: any
  error?: string
}

export type EmailDeliveryStatus =
  | 'queued'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed'
  | 'cancelled'
  | 'scheduled'
  | 'expired'

export interface EmailSendResult {
  success: boolean
  emailQueueId?: string
  providerMessageId?: string
  status: EmailDeliveryStatus
  error?: string
}

export interface EmailTemplateInput {
  user_name?: string
  user_id?: string
  profile_id?: string
  otp?: string
  associate_name?: string
  meeting_date?: string
  meeting_time?: string
  invoice_number?: string
  payment_amount?: string
  membership?: string
  renewal_date?: string
  support_email?: string
  company_name?: string
  website?: string
  dashboard_url?: string
  [key: string]: string | number | boolean | undefined
}
