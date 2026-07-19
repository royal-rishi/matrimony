// ============================================================
// WHATSAPP NOTIFICATION PROVIDER (Unified Adapter Integration)
// ============================================================

import type { INotificationProvider } from '../interfaces/notification-provider.interface'
import type { NotificationPayload, NotificationResult, ProviderHealthStatus } from '../types/notification.types'
import type { NotificationChannel } from '../interfaces/notification-provider.interface'
import { createClient } from '@/lib/supabase/server'
import { createWhatsAppService } from '../whatsapp/services/whatsapp-service.factory'

export class WhatsAppNotificationProvider implements INotificationProvider {
  readonly providerId = 'whatsapp-msg91'
  readonly displayName = 'WhatsApp MSG91 Provider'
  readonly channel: NotificationChannel = 'whatsapp'

  get isEnabled(): boolean {
    return true
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const supabase = await createClient()

      // 1. Resolve recipient phone number
      let toPhone = payload.recipientPhone
      if (!toPhone && payload.userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mobile_number')
          .eq('id', payload.userId)
          .maybeSingle()
        
        toPhone = profile?.mobile_number
      }

      if (!toPhone) {
        return {
          success: false,
          channelResults: [
            {
              channel: 'whatsapp',
              success: false,
              error: 'Recipient phone number is missing or could not be resolved.',
            },
          ],
        }
      }

      // Format to E.164 if it is a 10-digit number
      let formattedPhone = toPhone.trim()
      if (/^\d{10}$/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`
      }

      // 2. Resolve event type and variables from notifications table
      const { data: notif } = await supabase
        .from('notifications')
        .select('type, metadata')
        .eq('id', payload.notificationId)
        .maybeSingle()

      const eventType = notif?.type || 'system.transactional'

      // Extract template variables from notification metadata
      const rawVars = notif?.metadata?.templateData || notif?.metadata?.variables || payload.metadata?.templateData || payload.metadata || {}
      const templateVariables: Record<string, string | number | boolean> = {}

      for (const [key, val] of Object.entries(rawVars)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          templateVariables[key] = val
        }
      }

      // 3. Call the WhatsAppService orchestrator to send/queue the message
      const waService = createWhatsAppService()
      const sendResult = await waService.sendWhatsApp(formattedPhone, eventType, templateVariables, {
        userId: payload.userId,
        notificationId: payload.notificationId,
        priority: payload.priority,
        mediaUrl: payload.imageUrl || undefined,
        mediaType: payload.metadata?.mediaType as any,
      })

      return {
        success: sendResult.success,
        notificationId: payload.notificationId,
        channelResults: [
          {
            channel: 'whatsapp',
            success: sendResult.success,
            externalMessageId: sendResult.providerMessageId,
            error: sendResult.error,
            sentAt: new Date().toISOString(),
          },
        ],
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown WhatsApp provider send error'
      console.error('[WhatsAppNotificationProvider] send failed:', errMsg)
      return {
        success: false,
        channelResults: [
          {
            channel: 'whatsapp',
            success: false,
            error: errMsg,
          },
        ],
      }
    }
  }

  async sendBatch(payloads: NotificationPayload[]): Promise<NotificationResult[]> {
    return Promise.all(payloads.map((p) => this.send(p)))
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    return {
      providerId: this.providerId,
      isHealthy: true,
      message: 'WhatsApp provider active.',
      checkedAt: new Date().toISOString(),
    }
  }
}
