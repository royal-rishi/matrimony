// ============================================================
// NOTIFICATION PROVIDER INTERFACE
// Abstract contract that every delivery-channel provider must implement.
// Following the Interface Segregation and Dependency Inversion principles.
// ============================================================

import type {
  NotificationPayload,
  NotificationResult,
  ProviderHealthStatus,
} from '../types/notification.types'

/**
 * Core provider contract.
 * Every channel implementation (Email, SMS, Push, WhatsApp) MUST implement this.
 */
export interface INotificationProvider {
  /** Unique identifier for this provider (e.g. 'email-resend', 'sms-msg91') */
  readonly providerId: string

  /** Human-readable name displayed in logs & admin dashboards */
  readonly displayName: string

  /** The delivery channel this provider handles */
  readonly channel: NotificationChannel

  /** Whether this provider is currently enabled via feature flags */
  readonly isEnabled: boolean

  /**
   * Send a single notification.
   * Must be idempotent — safe to retry on transient failures.
   */
  send(payload: NotificationPayload): Promise<NotificationResult>

  /**
   * Send a batch of notifications.
   * Default implementation: sequential sends. Override for true bulk APIs.
   */
  sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]>

  /**
   * Health check — called by the NotificationService before sending
   * to verify the provider is reachable.
   */
  healthCheck(): Promise<ProviderHealthStatus>
}

/**
 * Optional extended interface for providers that support delivery receipts.
 */
export interface IDeliveryTrackingProvider extends INotificationProvider {
  /** Poll the provider for the current delivery status of a sent notification */
  getDeliveryStatus(externalMessageId: string): Promise<DeliveryStatus>
}

// ---- Supporting Enums & Literals ----

export type NotificationChannel =
  | 'in_app'   // Real-time in-app bell notifications (Supabase Realtime)
  | 'email'    // Transactional email (Phase 2: Resend / AWS SES)
  | 'sms'      // SMS (Phase 2: MSG91 / Twilio)
  | 'push'     // Mobile push (Phase 3: FCM / APNs)
  | 'whatsapp' // WhatsApp Business (Phase 4)

export type DeliveryStatus =
  | 'queued'
  | 'dispatched'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'bounced'
