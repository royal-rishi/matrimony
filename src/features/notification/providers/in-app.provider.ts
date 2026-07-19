// ============================================================
// IN-APP NOTIFICATION PROVIDER
// Phase 1 provider — persists notifications to Supabase.
// Supabase Realtime broadcasts the INSERT event to the client.
// No external API calls — self-contained and always-on.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { INotificationProvider } from '../interfaces/notification-provider.interface'
import type { NotificationPayload, NotificationResult, ProviderHealthStatus } from '../types/notification.types'
import type { NotificationChannel } from '../interfaces/notification-provider.interface'

export class InAppNotificationProvider implements INotificationProvider {
  readonly providerId = 'in-app-supabase'
  readonly displayName = 'In-App (Supabase Realtime)'
  readonly channel: NotificationChannel = 'in_app'
  readonly isEnabled = true

  /**
   * The in-app provider's job is already done by the repository INSERT.
   * Supabase Realtime automatically broadcasts the new row to subscribed clients.
   * This method is a no-op but required to satisfy the INotificationProvider contract.
   */
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    // The notification is already persisted by NotificationService before calling providers.
    // Real-time delivery happens via Supabase Realtime on the `notifications` table.
    return {
      success: true,
      notificationId: payload.notificationId,
      channelResults: [
        {
          channel: 'in_app',
          success: true,
          externalMessageId: payload.notificationId,
          sentAt: new Date().toISOString(),
        },
      ],
    }
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)))
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now()
    try {
      const supabase = await createClient()
      const { error } = await supabase.from('notifications').select('id').limit(1)
      const latencyMs = Date.now() - start

      return {
        providerId: this.providerId,
        isHealthy: !error,
        latencyMs,
        message: error ? error.message : 'Supabase connection healthy',
        checkedAt: new Date().toISOString(),
      }
    } catch (err) {
      return {
        providerId: this.providerId,
        isHealthy: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : 'Unknown error',
        checkedAt: new Date().toISOString(),
      }
    }
  }
}
