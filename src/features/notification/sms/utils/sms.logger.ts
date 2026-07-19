// ============================================================
// SMS AUDIT LOGGER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { DeliveryStatus, NotificationEvent } from '../../types/notification-database.types'

export interface SmsLogData {
  notificationId: string
  userId: string
  event: string
  status: DeliveryStatus
  provider: string
  recipientPhone: string
  templateId?: string
  requestPayload: any
  responsePayload?: any
  errorMessage?: string
  errorCode?: string
  providerMessageId?: string
  retryCount?: number
  costUnits?: number
}

export class SMSLogger {
  /**
   * Records SMS transaction and status in notification_logs.
   * If a log already exists for this notification/channel, we update it.
   */
  static async logAction(data: SmsLogData): Promise<string | null> {
    try {
      const supabase = await createClient()

      // Log records must contain monthly partitioned created_at values, which default to now()
      const logInsert = {
        notification_id: data.notificationId,
        user_id: data.userId,
        event: data.event as NotificationEvent,
        channel: 'sms' as const,
        status: data.status,
        provider: data.provider,
        template_id: data.templateId || null,
        request_payload: data.requestPayload,
        response_payload: data.responsePayload || null,
        error_message: data.errorMessage || null,
        error_code: data.errorCode || null,
        provider_message_id: data.providerMessageId || null,
        recipient: data.recipientPhone,
        delivered_at: data.status === 'delivered' ? new Date().toISOString() : null,
        failed_at: data.status === 'failed' ? new Date().toISOString() : null,
        retry_count: data.retryCount || 0,
        cost_units: String(data.costUnits || 0),
      }

      const { data: inserted, error } = await supabase
        .from('notification_logs')
        .insert(logInsert)
        .select('id')
        .maybeSingle()

      if (error) {
        console.error('[SMSLogger] Failed to write notification_logs:', error)
        return null
      }

      return inserted?.id || null
    } catch (err) {
      console.error('[SMSLogger] Exception logging action:', err)
      return null
    }
  }

  /**
   * Invokes the database RPC function fn_mark_delivered to synchronize delivery reports.
   */
  static async markDelivered(
    logId: string,
    notificationId: string,
    providerMessageId: string,
    responsePayload: any = {}
  ): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.rpc('fn_mark_delivered', {
        p_log_id: logId,
        p_notification_id: notificationId,
        p_channel: 'sms',
        p_provider_message_id: providerMessageId,
        p_response_payload: responsePayload,
      })
    } catch (err) {
      console.error('[SMSLogger] Exception marking delivered:', err)
    }
  }

  /**
   * Invokes the database RPC function fn_mark_failed to synchronize delivery reports.
   */
  static async markFailed(
    logId: string,
    notificationId: string,
    errorMessage: string,
    errorCode: string = 'DELIVERY_FAILURE',
    providerName: string = 'msg91'
  ): Promise<void> {
    try {
      const supabase = await createClient()
      await supabase.rpc('fn_mark_failed', {
        p_log_id: logId,
        p_notification_id: notificationId,
        p_channel: 'sms',
        p_error_message: errorMessage,
        p_error_code: errorCode,
        p_provider: providerName,
      })
    } catch (err) {
      console.error('[SMSLogger] Exception marking failed:', err)
    }
  }
}
