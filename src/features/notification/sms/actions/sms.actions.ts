'use server'

// ============================================================
// SMS SERVER ACTIONS
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { createSmsService } from '../services/sms-service.factory'
import { SMSLogger } from '../utils/sms.logger'
import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'

/**
 * Server Action: Instantly send a transactional SMS.
 */
export async function sendSMS(
  toPhone: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  userId?: string
) {
  try {
    const service = createSmsService()
    const result = await service.sendSMS(toPhone, eventType, variables, { userId })
    return {
      success: result.success,
      smsQueueId: result.smsQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[sendSMS Action] Execution failure:', err)
    return { success: false, status: 'failed', error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Schedule a transactional SMS for a future date.
 */
export async function scheduleSMS(
  toPhone: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  scheduledFor: string, // ISO Date String
  userId?: string
) {
  try {
    const date = new Date(scheduledFor)
    if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return { success: false, error: 'Invalid scheduling date. Must be in the future.' }
    }

    const service = createSmsService()
    const result = await service.sendSMS(toPhone, eventType, variables, {
      userId,
      scheduledFor: date,
    })

    return {
      success: result.success,
      smsQueueId: result.smsQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[scheduleSMS Action] Execution failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Retries a failed SMS manually from the queue.
 */
export async function retrySMS(smsQueueId: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch queue job details
    const { data: job, error } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('id', smsQueueId)
      .maybeSingle()

    if (error || !job) {
      return { success: false, error: 'SMS queue job not found.' }
    }

    if (job.status !== 'failed' && job.status !== 'dead_lettered') {
      return { success: false, error: `Cannot retry job in ${job.status} state.` }
    }

    // 2. Lock job
    await supabase
      .from('sms_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', smsQueueId)

    // 3. Dispatch using provider
    const service = createSmsService()
    const payload = {
      toPhone: job.to_phone,
      body: job.message_body,
      dltTemplateId: job.dlt_template_id || undefined,
      senderId: job.sender_id || undefined,
      priority: job.priority,
      templateVariables: job.template_variables,
    }

    const { data: parentNotif } = await supabase
      .from('notifications')
      .select('user_id, type')
      .eq('id', job.notification_id)
      .maybeSingle()

    const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
    const eventType = parentNotif?.type || 'system.transactional'

    // Fetch live provider from factory config
    const liveService = createSmsService()
    const provider = (liveService as any).provider

    const dispatchResult = await provider.sendSms(payload)

    const logId = await SMSLogger.logAction({
      notificationId: job.notification_id,
      userId,
      event: eventType,
      status: dispatchResult.success ? 'sent' : 'failed',
      provider: provider.providerId,
      recipientPhone: job.to_phone,
      templateId: job.template_id || undefined,
      requestPayload: { mobiles: job.to_phone, variables: job.template_variables },
      retryCount: job.attempts + 1,
      costUnits: job.segment_count * Number(job.cost_per_segment),
      providerMessageId: dispatchResult.providerMessageId,
    })

    if (dispatchResult.success) {
      await supabase
        .from('sms_queue')
        .update({
          status: 'completed',
          sent_at: new Date().toISOString(),
          provider_message_id: dispatchResult.providerMessageId,
          provider_response: dispatchResult.providerResponse,
          attempts: job.attempts + 1,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', smsQueueId)

      if (logId) {
        await SMSLogger.markDelivered(logId, job.notification_id, dispatchResult.providerMessageId || '', dispatchResult.providerResponse)
      }

      return { success: true, status: 'sent', providerMessageId: dispatchResult.providerMessageId }
    } else {
      await supabase
        .from('sms_queue')
        .update({
          status: 'failed',
          last_error: dispatchResult.error || 'Retry send failed',
          provider_response: dispatchResult.providerResponse,
          attempts: job.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', smsQueueId)

      if (logId) {
        await SMSLogger.markFailed(logId, job.notification_id, dispatchResult.error || 'Retry dispatch failed', 'PROVIDER_ERROR', provider.providerId)
      }

      return { success: false, status: 'failed', error: dispatchResult.error || 'Provider dispatch failed.' }
    }
  } catch (err) {
    console.error('[retrySMS Action] Execution failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Cancel a scheduled SMS.
 */
export async function cancelSMS(smsQueueId: string) {
  try {
    const supabase = await createClient()

    const { data: job } = await supabase
      .from('sms_queue')
      .select('status')
      .eq('id', smsQueueId)
      .maybeSingle()

    if (!job) {
      return { success: false, error: 'SMS queue job not found.' }
    }

    if (job.status !== 'pending' && job.status !== 'scheduled') {
      return { success: false, error: `Cannot cancel job in ${job.status} state.` }
    }

    const { error } = await supabase
      .from('sms_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', smsQueueId)

    if (error) {
      return { success: false, error: 'Failed to cancel scheduled SMS.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[cancelSMS Action] Execution failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Retrieve and synchronize the status of an SMS from the queue/provider.
 */
export async function getSMSStatus(smsQueueId: string) {
  try {
    const supabase = await createClient()
    const { data: job, error } = await supabase
      .from('sms_queue')
      .select('*')
      .eq('id', smsQueueId)
      .maybeSingle()

    if (error || !job) {
      return { success: false, error: 'SMS queue job not found.' }
    }

    // If completed but we have a provider ID, try to fetch the latest delivery report
    if (job.status === 'completed' && job.provider_message_id) {
      const liveService = createSmsService()
      const provider = (liveService as any).provider
      
      const latestStatus = await provider.getDeliveryStatus(job.provider_message_id)
      
      if (latestStatus === 'delivered') {
        await supabase
          .from('sms_queue')
          .update({
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', smsQueueId)

        return {
          success: true,
          status: 'delivered',
          attempts: job.attempts,
          sentAt: job.sent_at,
          deliveredAt: new Date().toISOString(),
        }
      }
    }

    return {
      success: true,
      status: job.status,
      attempts: job.attempts,
      sentAt: job.sent_at,
      deliveredAt: job.delivered_at,
      lastError: job.last_error,
    }
  } catch (err) {
    console.error('[getSMSStatus Action] Execution failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}
