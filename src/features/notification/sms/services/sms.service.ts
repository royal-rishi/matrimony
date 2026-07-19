// ============================================================
// SMS SERVICE (Orchestrator)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { ISmsProvider } from '../interfaces/sms-provider.interface'
import { SMSTemplateResolver } from './sms-template.resolver'
import { SMSPreferenceResolver } from './sms-preference.resolver'
import { SMSValidator } from '../validators/sms.validator'
import { SMSLogger } from '../utils/sms.logger'
import type { SmsSendResult, SmsPayload, SmsDeliveryStatus } from '../types/sms.types'
import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'
import { SMS_CONFIG } from '../config/sms.config'

export class SMSService {
  private readonly templateResolver: SMSTemplateResolver
  private readonly preferenceResolver: SMSPreferenceResolver
  private readonly validator: SMSValidator

  constructor(private readonly provider: ISmsProvider) {
    this.templateResolver = new SMSTemplateResolver()
    this.preferenceResolver = new SMSPreferenceResolver()
    this.validator = new SMSValidator()
  }

  /**
   * Orchestrates the complete send workflow: format checks, preferences check,
   * duplicate checks, template rendering, queue persistence, and provider dispatch.
   */
  async sendSMS(
    toPhone: string,
    eventType: string,
    templateVariables: Record<string, string | number | boolean> = {},
    options: {
      userId?: string
      notificationId?: string
      priority?: NotificationPriority
      scheduledFor?: Date
    } = {}
  ): Promise<SmsSendResult> {
    try {
      // 1. Phone number format validation
      if (!this.validator.isValidPhoneNumber(toPhone)) {
        return { success: false, status: 'failed', error: 'Invalid phone format. Must be E.164 (+91XXXXXXXXXX).' }
      }

      // 2. User preference check (if userId is provided)
      if (options.userId) {
        const prefAllowed = await this.preferenceResolver.isSmsAllowed(options.userId, eventType)
        if (!prefAllowed.allowed) {
          return { success: false, status: 'cancelled', error: prefAllowed.reason || 'SMS preference opt-out.' }
        }
      }

      // 3. Resolve template
      const template = await this.templateResolver.resolveTemplate(eventType)
      if (!template) {
        return { success: false, status: 'failed', error: `No active SMS template found for event: ${eventType}` }
      }

      // 4. Safe variable substitution
      const maskedVars = this.validator.maskSensitiveData(templateVariables)
      const renderedBody = this.templateResolver.renderBody(template.body, maskedVars)

      // 5. Calculate segments, unicode, cost
      const { segmentCount, isUnicode, costPerSegment } = this.templateResolver.calculateSegments(renderedBody)

      // 6. Anti-spam duplicate check
      const isDup = await this.validator.isDuplicateSend(toPhone, renderedBody)
      if (isDup) {
        return { success: false, status: 'cancelled', error: 'Duplicate message detected. Suppressed by spam filter.' }
      }

      const supabase = await createClient()

      // Resolve base notification ID (if none supplied, create a generic notification record first)
      let finalNotificationId = options.notificationId
      if (!finalNotificationId && options.userId) {
        const { data: newNotif, error: notifErr } = await supabase
          .from('notifications')
          .insert({
            user_id: options.userId,
            type: eventType,
            title: template.name,
            body: renderedBody,
            priority: options.priority || 'normal',
            channels: ['sms'],
            status: 'pending',
          })
          .select('id')
          .maybeSingle()

        if (notifErr || !newNotif) {
          console.error('[SMSService] Failed to insert parent notification:', notifErr)
          return { success: false, status: 'failed', error: 'Failed to record parent notification.' }
        }
        finalNotificationId = newNotif.id
      } else if (!finalNotificationId) {
        // If no user_id and no notificationId, we generate a dummy UUID to satisfy constraint
        // (For anonymous/admin messages not tied to an in-app user account)
        return { success: false, status: 'failed', error: 'Missing userId or notificationId to link SMS.' }
      }

      // 7. Persist to sms_queue (default to pending or scheduled)
      const isScheduled = options.scheduledFor && options.scheduledFor.getTime() > Date.now()
      const initialStatus: QueueStatus = isScheduled ? 'scheduled' : 'pending'
      const scheduledTimeStr = options.scheduledFor ? options.scheduledFor.toISOString() : new Date().toISOString()

      const { data: queueRow, error: queueErr } = await supabase
        .from('sms_queue')
        .insert({
          notification_id: finalNotificationId as string,
          to_phone: toPhone,
          country_code: toPhone.slice(0, 3) || '+91',
          message_body: renderedBody,
          dlt_template_id: template.dlt_template_id,
          sender_id: template.sender_id || SMS_CONFIG.defaultSenderId,
          is_unicode: isUnicode,
          template_id: template.id,
          template_variables: templateVariables,
          priority: options.priority || 'normal',
          status: initialStatus,
          scheduled_for: scheduledTimeStr,
          provider: this.provider.providerId,
          segment_count: segmentCount,
          cost_per_segment: costPerSegment,
          attempts: 0,
          max_attempts: 5,
        })
        .select('id')
        .maybeSingle()

      if (queueErr || !queueRow) {
        console.error('[SMSService] Failed to write to sms_queue:', queueErr)
        return { success: false, status: 'failed', error: 'Database queue write failure.' }
      }

      // Write initial log
      const logId = await SMSLogger.logAction({
        notificationId: finalNotificationId as string,
        userId: options.userId || '00000000-0000-0000-0000-000000000000',
        event: eventType,
        status: isScheduled ? 'pending' : 'sent',
        provider: this.provider.providerId,
        recipientPhone: toPhone,
        templateId: template.id,
        requestPayload: { mobiles: toPhone, flow_id: template.dlt_template_id, variables: templateVariables },
        retryCount: 0,
        costUnits: segmentCount * costPerSegment,
      })

      // If scheduled for future, we do not dispatch now.
      if (isScheduled) {
        return {
          success: true,
          smsQueueId: queueRow.id,
          status: 'scheduled',
        }
      }

      // 8. Update queue row to 'processing'
      await supabase
        .from('sms_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', queueRow.id)

      // 9. Dispatch to SMS Provider
      const payload: SmsPayload = {
        toPhone,
        body: renderedBody,
        dltTemplateId: template.dlt_template_id || undefined,
        senderId: template.sender_id || undefined,
        priority: options.priority,
        templateVariables: templateVariables,
      }

      const dispatchResult = await this.provider.sendSms(payload)

      if (dispatchResult.success) {
        // Success
        await supabase
          .from('sms_queue')
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
          await SMSLogger.markDelivered(logId, finalNotificationId as string, dispatchResult.providerMessageId || '', dispatchResult.providerResponse)
        }

        return {
          success: true,
          smsQueueId: queueRow.id,
          providerMessageId: dispatchResult.providerMessageId,
          status: 'sent',
        }
      } else {
        // Failure - update queue to failed, increment attempts
        await supabase
          .from('sms_queue')
          .update({
            status: 'failed',
            last_error: dispatchResult.error || 'Provider send failed',
            provider_response: dispatchResult.providerResponse,
            attempts: 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', queueRow.id)

        if (logId) {
          await SMSLogger.markFailed(logId, finalNotificationId as string, dispatchResult.error || 'Provider dispatch failed', 'PROVIDER_ERROR', this.provider.providerId)
        }

        return {
          success: false,
          smsQueueId: queueRow.id,
          status: 'failed',
          error: dispatchResult.error || 'Provider send failed',
        }
      }
    } catch (err) {
      console.error('[SMSService] Exception in sendSMS orchestrator:', err)
      return {
        success: false,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown internal error',
      }
    }
  }
}
