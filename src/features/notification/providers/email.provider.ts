// ============================================================
// EMAIL NOTIFICATION PROVIDER (Production MSG91 Integration)
// ============================================================

import type { INotificationProvider } from '../interfaces/notification-provider.interface'
import type { NotificationPayload, NotificationResult, ProviderHealthStatus } from '../types/notification.types'
import type { NotificationChannel } from '../interfaces/notification-provider.interface'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createEmailService } from '../email/services/email-service.factory'

export class EmailNotificationProvider implements INotificationProvider {
  readonly providerId = 'email-msg91'
  readonly displayName = 'Email MSG91 Provider'
  readonly channel: NotificationChannel = 'email'

  get isEnabled(): boolean {
    return true
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const supabase = await createClient()

      // 1. Resolve recipient email address
      let toEmail = payload.recipientEmail
      if (!toEmail && payload.userId) {
        const adminSupabase = await createAdminClient()
        const { data: authUser, error: authUserErr } = await adminSupabase.auth.admin.getUserById(payload.userId)
        
        if (!authUserErr && authUser?.user?.email) {
          toEmail = authUser.user.email
        }
      }

      if (!toEmail) {
        return {
          success: false,
          channelResults: [
            {
              channel: 'email',
              success: false,
              error: 'Recipient email address is missing or could not be resolved.',
            },
          ],
        }
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

      // Ensure all keys are strings and values are simple primitives
      for (const [key, val] of Object.entries(rawVars)) {
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          templateVariables[key] = val
        }
      }

      // 3. Call the EmailService orchestrator to send/queue the email
      const emailService = createEmailService()
      const sendResult = await emailService.sendEmail(toEmail, eventType, templateVariables, {
        userId: payload.userId,
        notificationId: payload.notificationId,
        priority: payload.priority,
      })

      return {
        success: sendResult.success,
        notificationId: payload.notificationId,
        channelResults: [
          {
            channel: 'email',
            success: sendResult.success,
            externalMessageId: sendResult.providerMessageId,
            error: sendResult.error,
            sentAt: new Date().toISOString(),
          },
        ],
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown email provider send error'
      console.error('[EmailNotificationProvider] send failed:', errMsg)
      return {
        success: false,
        channelResults: [
          {
            channel: 'email',
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
      message: 'Email provider active.',
      checkedAt: new Date().toISOString(),
    }
  }
}
