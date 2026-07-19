// ============================================================
// SMS NOTIFICATION PROVIDER (Production MSG91 Integration)
// ============================================================

import type { INotificationProvider } from '../interfaces/notification-provider.interface'
import type { NotificationPayload, NotificationResult, ProviderHealthStatus } from '../types/notification.types'
import type { NotificationChannel } from '../interfaces/notification-provider.interface'
import { createClient } from '@/lib/supabase/server'
import { createSmsService } from '../sms/services/sms-service.factory'

export class SmsNotificationProvider implements INotificationProvider {
  readonly providerId = 'sms-msg91'
  readonly displayName = 'SMS MSG91 Provider'
  readonly channel: NotificationChannel = 'sms'

  get isEnabled(): boolean {
    // Check if the service auth key is present
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
              channel: 'sms',
              success: false,
              error: 'Recipient phone number is missing or could not be resolved.',
            },
          ],
        }
      }

      // 2. Format phone number to E.164 if it is a 10-digit number
      let formattedPhone = toPhone.trim()
      if (/^\d{10}$/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`
      }

      // 3. Resolve event type and variables from notifications table
      const { data: notif } = await supabase
        .from('notifications')
        .select('type, metadata')
        .eq('id', payload.notificationId)
        .maybeSingle()

      const eventType = notif?.type || 'system.transactional'
      
      // Extract template variables from notification metadata
      const rawVars = notif?.metadata?.templateData || notif?.metadata?.variables || payload.metadata?.templateData || payload.metadata || {}
      const templateVariables: Record<string, string | number | boolean> = {}
      
      // Ensure all keys are strings and values are simple primitives
      for (const [key, val] of Object.entries(rawVars)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          templateVariables[key] = val
        }
      }

      // 4. Call the SMSService orchestrator to send/queue the SMS
      const smsService = createSmsService()
      const sendResult = await smsService.sendSMS(formattedPhone, eventType, templateVariables, {
        userId: payload.userId,
        notificationId: payload.notificationId,
        priority: payload.priority,
      })

      return {
        success: sendResult.success,
        notificationId: payload.notificationId,
        channelResults: [
          {
            channel: 'sms',
            success: sendResult.success,
            externalMessageId: sendResult.providerMessageId,
            error: sendResult.error,
            sentAt: new Date().toISOString(),
          },
        ],
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown provider send error'
      console.error('[SmsNotificationProvider] send failed:', errMsg)
      return {
        success: false,
        channelResults: [
          {
            channel: 'sms',
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
      message: 'SMS provider active.',
      checkedAt: new Date().toISOString(),
    }
  }
}
