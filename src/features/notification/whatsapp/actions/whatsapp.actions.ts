'use server'

// ============================================================
// WHATSAPP SERVER ACTIONS
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { createWhatsAppService } from '../services/whatsapp-service.factory'
import { WhatsAppPreviewService } from '../services/whatsapp-preview.service'
import { WhatsAppLogger } from '../utils/whatsapp.logger'
import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'

/**
 * Server Action: Instantly send a WhatsApp template message.
 */
export async function sendWhatsApp(
  toPhone: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  userId?: string
) {
  try {
    const service = createWhatsAppService()
    const result = await service.sendWhatsApp(toPhone, eventType, variables, { userId })
    return {
      success: result.success,
      whatsappQueueId: result.whatsappQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[sendWhatsApp Action] Failure:', err)
    return { success: false, status: 'failed', error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Schedule a WhatsApp template message for a future date.
 */
export async function scheduleWhatsApp(
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

    const service = createWhatsAppService()
    const result = await service.sendWhatsApp(toPhone, eventType, variables, {
      userId,
      scheduledFor: date,
    })

    return {
      success: result.success,
      whatsappQueueId: result.whatsappQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[scheduleWhatsApp Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Retries a failed WhatsApp message manually from the queue.
 */
export async function retryWhatsApp(whatsappQueueId: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch queue job details
    const { data: job, error } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('id', whatsappQueueId)
      .maybeSingle()

    if (error || !job) {
      return { success: false, error: 'WhatsApp queue job not found.' }
    }

    if (job.status !== 'failed' && job.status !== 'dead_lettered') {
      return { success: false, error: `Cannot retry job in ${job.status} state.` }
    }

    // 2. Lock job
    await supabase
      .from('whatsapp_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', whatsappQueueId)

    // 3. Dispatch using provider
    const liveService = createWhatsAppService()
    const provider = (liveService as any).provider

    const payload = {
      toPhone: job.to_phone,
      templateName: job.template_name,
      language: job.template_language,
      variables: job.template_variables,
      mediaUrl: job.media_url || undefined,
      mediaType: job.media_type || undefined,
      buttons: job.button_payload ? JSON.parse(job.button_payload) : undefined,
    }

    const { data: parentNotif } = await supabase
      .from('notifications')
      .select('user_id, type')
      .eq('id', job.notification_id)
      .maybeSingle()

    const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
    const eventType = parentNotif?.type || 'system.transactional'

    const dispatchResult = await provider.sendWhatsApp(payload)

    const logId = await WhatsAppLogger.logAction({
      notificationId: job.notification_id,
      userId,
      event: eventType,
      status: dispatchResult.success ? 'sent' : 'failed',
      provider: provider.providerId,
      recipientPhone: job.to_phone,
      requestPayload: { to: job.to_phone, template: job.template_name },
      retryCount: job.attempts + 1,
      costUnits: Number(job.cost_units || 0),
      providerMessageId: dispatchResult.providerMessageId,
    })

    if (dispatchResult.success) {
      await supabase
        .from('whatsapp_queue')
        .update({
          status: 'completed',
          sent_at: new Date().toISOString(),
          provider_message_id: dispatchResult.providerMessageId,
          provider_response: dispatchResult.providerResponse,
          attempts: job.attempts + 1,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', whatsappQueueId)

      if (logId) {
        await WhatsAppLogger.markDelivered(logId, job.notification_id, dispatchResult.providerMessageId || '', dispatchResult.providerResponse)
      }

      return { success: true, status: 'sent', providerMessageId: dispatchResult.providerMessageId }
    } else {
      await supabase
        .from('whatsapp_queue')
        .update({
          status: 'failed',
          last_error: dispatchResult.error || 'Retry send failed',
          provider_response: dispatchResult.providerResponse,
          attempts: job.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', whatsappQueueId)

      if (logId) {
        await WhatsAppLogger.markFailed(logId, job.notification_id, dispatchResult.error || 'Retry dispatch failed', 'PROVIDER_ERROR', provider.providerId)
      }

      return { success: false, status: 'failed', error: dispatchResult.error || 'Provider dispatch failed.' }
    }
  } catch (err) {
    console.error('[retryWhatsApp Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Cancel a scheduled WhatsApp message.
 */
export async function cancelWhatsApp(whatsappQueueId: string) {
  try {
    const supabase = await createClient()

    const { data: job } = await supabase
      .from('whatsapp_queue')
      .select('status')
      .eq('id', whatsappQueueId)
      .maybeSingle()

    if (!job) {
      return { success: false, error: 'WhatsApp queue job not found.' }
    }

    if (job.status !== 'pending' && job.status !== 'scheduled') {
      return { success: false, error: `Cannot cancel job in ${job.status} state.` }
    }

    const { error } = await supabase
      .from('whatsapp_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', whatsappQueueId)

    if (error) {
      return { success: false, error: 'Failed to cancel scheduled WhatsApp message.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[cancelWhatsApp Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Preview template rendering.
 */
export async function previewWhatsApp(eventType: string, variables: Record<string, string | number | boolean> = {}) {
  try {
    const previewService = new WhatsAppPreviewService()
    return await previewService.renderPreview(eventType, variables)
  } catch (err) {
    console.error('[previewWhatsApp Action] Failure:', err)
    return {
      templateName: 'Error',
      bodyPreview: 'Failed to generate visual preview.',
      components: [],
      templateFound: false,
    }
  }
}

/**
 * Server Action: Sends a test WhatsApp message.
 */
export async function sendTestWhatsApp(toPhone: string, eventType: string, variables: Record<string, string | number | boolean> = {}) {
  try {
    const service = createWhatsAppService()
    const result = await service.sendWhatsApp(toPhone, eventType, variables)
    return {
      success: result.success,
      whatsappQueueId: result.whatsappQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[sendTestWhatsApp Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}
