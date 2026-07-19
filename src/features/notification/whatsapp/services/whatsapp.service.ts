// ============================================================
// WHATSAPP SERVICE (Orchestrator)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { IWhatsAppProvider } from '../interfaces/whatsapp-provider.interface'
import { WhatsAppTemplateResolver } from './whatsapp-template.resolver'
import { WhatsAppPreferenceResolver } from './whatsapp-preference.resolver'
import { WhatsAppValidator } from '../validators/whatsapp.validator'
import { WhatsAppLogger } from '../utils/whatsapp.logger'
import type { WhatsAppSendResult, WhatsAppMediaType, WhatsAppButton } from '../types/whatsapp.types'
import { ANALYTICS_CONFIG } from '../config/analytics.config'
import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'

export class WhatsAppService {
  private readonly templateResolver = new WhatsAppTemplateResolver()
  private readonly preferenceResolver = new WhatsAppPreferenceResolver()
  private readonly validator = new WhatsAppValidator()

  constructor(private readonly provider: IWhatsAppProvider) {}

  /**
   * Orchestrates sending a WhatsApp template message: validates formatting, checks opt-in status,
   * resolves template schema, checks for double-send spam, enqueues to database, and dispatches via provider.
   */
  async sendWhatsApp(
    toPhone: string,
    eventType: string,
    variables: Record<string, string | number | boolean> = {},
    options: {
      userId?: string
      notificationId?: string
      priority?: NotificationPriority
      scheduledFor?: Date
      mediaUrl?: string
      mediaType?: WhatsAppMediaType
      buttons?: WhatsAppButton[]
    } = {}
  ): Promise<WhatsAppSendResult> {
    try {
      // 1. Validate Phone format
      if (!this.validator.isValidPhoneNumber(toPhone)) {
        return { success: false, status: 'failed', error: 'Invalid phone format. Must be E.164 (+91XXXXXXXXXX).' }
      }

      // 2. Resolve preferences
      if (options.userId) {
        const prefAllowed = await this.preferenceResolver.isWhatsAppAllowed(options.userId, eventType)
        if (!prefAllowed.allowed) {
          return { success: false, status: 'cancelled', error: prefAllowed.reason || 'WhatsApp preference opt-out.' }
        }
      }

      // 3. Resolve WhatsApp Template Schema
      const schema = await this.templateResolver.resolveTemplate(eventType)
      if (!schema) {
        return { success: false, status: 'failed', error: `WhatsApp template schema not resolved for event: ${eventType}` }
      }

      // 4. Duplicate Send check
      const isDup = await this.validator.isDuplicateSend(toPhone, schema.templateName)
      if (isDup) {
        return { success: false, status: 'cancelled', error: 'Duplicate message detected. Suppressed by spam filter.' }
      }

      const supabase = await createClient()

      // Resolve parent notification
      let finalNotificationId = options.notificationId
      if (!finalNotificationId && options.userId) {
        const { data: newNotif, error: notifErr } = await supabase
          .from('notifications')
          .insert({
            user_id: options.userId,
            type: eventType,
            title: `WhatsApp: ${schema.templateName}`,
            body: `Sent Wa template ${schema.templateName}`,
            priority: options.priority || 'normal',
            channels: ['whatsapp'],
            status: 'pending',
          })
          .select('id')
          .maybeSingle()

        if (notifErr || !newNotif) {
          console.error('[WhatsAppService] Failed to insert parent notification:', notifErr)
          return { success: false, status: 'failed', error: 'Failed to record parent notification.' }
        }
        finalNotificationId = newNotif.id
      } else if (!finalNotificationId) {
        return { success: false, status: 'failed', error: 'Missing userId or notificationId to link WhatsApp message.' }
      }

      // 5. Persist to whatsapp_queue
      const isScheduled = options.scheduledFor && options.scheduledFor.getTime() > Date.now()
      const initialStatus: QueueStatus = isScheduled ? 'scheduled' : 'pending'
      const scheduledTimeStr = options.scheduledFor ? options.scheduledFor.toISOString() : new Date().toISOString()

      const { data: queueRow, error: queueErr } = await supabase
        .from('whatsapp_queue')
        .insert({
          notification_id: finalNotificationId as string,
          to_phone: toPhone,
          template_name: schema.templateName,
          template_language: 'en',
          template_variables: variables,
          media_url: options.mediaUrl || null,
          media_type: options.mediaType || null,
          button_payload: options.buttons ? JSON.stringify(options.buttons) : null,
          template_id: null,
          priority: options.priority || 'normal',
          status: initialStatus,
          scheduled_for: scheduledTimeStr,
          provider: this.provider.providerId,
          attempts: 0,
          max_attempts: 5,
          cost_units: ANALYTICS_CONFIG.defaultCostPerMessage,
        })
        .select('id')
        .maybeSingle()

      if (queueErr || !queueRow) {
        console.error('[WhatsAppService] Failed to write to whatsapp_queue:', queueErr)
        return { success: false, status: 'failed', error: 'Database queue write failure.' }
      }

      const maskedVars = this.validator.maskSensitiveData(variables)

      // Write initial audit log
      const logId = await WhatsAppLogger.logAction({
        notificationId: finalNotificationId as string,
        userId: options.userId || '00000000-0000-0000-0000-000000000000',
        event: eventType,
        status: isScheduled ? 'pending' : 'sent',
        provider: this.provider.providerId,
        recipientPhone: toPhone,
        requestPayload: { to: toPhone, template: schema.templateName },
        retryCount: 0,
        costUnits: ANALYTICS_CONFIG.defaultCostPerMessage,
      })

      if (isScheduled) {
        return {
          success: true,
          whatsappQueueId: queueRow.id,
          status: 'scheduled',
        }
      }

      // 6. Update status -> 'processing'
      await supabase
        .from('whatsapp_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', queueRow.id)

      // 7. Dispatch via provider
      const dispatchResult = await this.provider.sendWhatsApp({
        toPhone,
        templateName: eventType, // Pass event type to provider so it can resolve mapping from registry
        language: 'en',
        variables: maskedVars,
        mediaUrl: options.mediaUrl,
        mediaType: options.mediaType,
        buttons: options.buttons,
      })

      if (dispatchResult.success) {
        await supabase
          .from('whatsapp_queue')
          .update({
            status: 'completed',
            sent_at: new Date().toISOString(),
            provider_message_id: dispatchResult.providerMessageId,
            provider_response: dispatchResult.providerResponse,
            attempts: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueRow.id)

        if (logId) {
          await WhatsAppLogger.markDelivered(logId, finalNotificationId as string, dispatchResult.providerMessageId || '', dispatchResult.providerResponse)
        }

        return {
          success: true,
          whatsappQueueId: queueRow.id,
          providerMessageId: dispatchResult.providerMessageId,
          status: 'sent',
        }
      } else {
        await supabase
          .from('whatsapp_queue')
          .update({
            status: 'failed',
            last_error: dispatchResult.error || 'Provider send failed',
            provider_response: dispatchResult.providerResponse,
            attempts: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueRow.id)

        if (logId) {
          await WhatsAppLogger.markFailed(logId, finalNotificationId as string, dispatchResult.error || 'Provider dispatch failed', 'PROVIDER_ERROR', this.provider.providerId)
        }

        return {
          success: false,
          whatsappQueueId: queueRow.id,
          status: 'failed',
          error: dispatchResult.error || 'Provider send failed',
        }
      }
    } catch (err) {
      console.error('[WhatsAppService] Send WhatsApp exception:', err)
      return {
        success: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown internal error',
      }
    }
  }
}
