'use server'

// ============================================================
// EMAIL SERVER ACTIONS
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { EmailFactory } from '../factory/email.factory'
import { EmailPreviewService } from '../services/email-preview.service'
import { EmailLogger } from '../services/email.logger'
import type { NotificationPriority, QueueStatus } from '../../types/notification-database.types'

/**
 * Server Action: Instantly send a transactional email.
 */
export async function sendEmail(
  toEmail: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  userId?: string
) {
  try {
    const service = EmailFactory.create()
    const result = await service.sendEmail(toEmail, eventType, variables, { userId })
    return {
      success: result.success,
      emailQueueId: result.emailQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[sendEmail Action] Failure:', err)
    return { success: false, status: 'failed', error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Schedule a transactional email for a future date.
 */
export async function scheduleEmail(
  toEmail: string,
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

    const service = EmailFactory.create()
    const result = await service.sendEmail(toEmail, eventType, variables, {
      userId,
      scheduledFor: date,
    })

    return {
      success: result.success,
      emailQueueId: result.emailQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[scheduleEmail Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Retries a failed email manually from the queue.
 */
export async function retryEmail(emailQueueId: string) {
  try {
    const supabase = await createClient()

    // 1. Fetch queue job details
    const { data: job, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('id', emailQueueId)
      .maybeSingle()

    if (error || !job) {
      return { success: false, error: 'Email queue job not found.' }
    }

    if (job.status !== 'failed' && job.status !== 'dead_lettered') {
      return { success: false, error: `Cannot retry job in ${job.status} state.` }
    }

    // 2. Lock job
    await supabase
      .from('email_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', emailQueueId)

    // 3. Dispatch using provider
    const liveService = EmailFactory.create()
    const provider = liveService.provider

    const payload = {
      toEmail: job.to_email,
      toName: job.to_name,
      subject: job.subject,
      htmlBody: job.html_body,
      fromEmail: job.from_email,
      fromName: job.from_name,
      replyTo: job.reply_to || undefined,
      attachments: job.attachments,
      templateId: job.template_id || undefined,
      variables: job.template_variables || undefined,
    }

    const { data: parentNotif } = await supabase
      .from('notifications')
      .select('user_id, type')
      .eq('id', job.notification_id)
      .maybeSingle()

    const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
    const eventType = parentNotif?.type || 'system.transactional'

    const dispatchResult = await provider.send(payload)

    const logId = await EmailLogger.logAction({
      notificationId: job.notification_id,
      userId,
      event: eventType,
      status: dispatchResult.success ? 'sent' : 'failed',
      provider: provider.providerId,
      recipientEmail: job.to_email,
      requestPayload: { to: job.to_email, subject: job.subject },
      retryCount: job.attempts + 1,
      costUnits: 0.002,
      providerMessageId: dispatchResult.providerMessageId,
    })

    if (dispatchResult.success) {
      await supabase
        .from('email_queue')
        .update({
          status: 'completed',
          sent_at: new Date().toISOString(),
          provider_message_id: dispatchResult.providerMessageId,
          provider_response: dispatchResult.providerResponse,
          attempts: job.attempts + 1,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailQueueId)

      if (logId) {
        await EmailLogger.markDelivered(logId, job.notification_id, dispatchResult.providerMessageId || '', dispatchResult.providerResponse)
      }

      return { success: true, status: 'sent', providerMessageId: dispatchResult.providerMessageId }
    } else {
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          last_error: dispatchResult.error || 'Retry send failed',
          provider_response: dispatchResult.providerResponse,
          attempts: job.attempts + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailQueueId)

      if (logId) {
        await EmailLogger.markFailed(logId, job.notification_id, dispatchResult.error || 'Retry dispatch failed', 'PROVIDER_ERROR', provider.providerId)
      }

      return { success: false, status: 'failed', error: dispatchResult.error || 'Provider dispatch failed.' }
    }
  } catch (err) {
    console.error('[retryEmail Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Cancel a scheduled email.
 */
export async function cancelEmail(emailQueueId: string) {
  try {
    const supabase = await createClient()

    const { data: job } = await supabase
      .from('email_queue')
      .select('status')
      .eq('id', emailQueueId)
      .maybeSingle()

    if (!job) {
      return { success: false, error: 'Email queue job not found.' }
    }

    if (job.status !== 'pending' && job.status !== 'scheduled') {
      return { success: false, error: `Cannot cancel job in ${job.status} state.` }
    }

    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', emailQueueId)

    if (error) {
      return { success: false, error: 'Failed to cancel scheduled email.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[cancelEmail Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}

/**
 * Server Action: Renders preview of a template.
 */
export async function previewEmail(
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  theme: 'light' | 'dark' | 'brand' | 'auto' = 'brand'
) {
  try {
    const previewService = new EmailPreviewService()
    return await previewService.renderPreview(eventType, variables, theme)
  } catch (err) {
    console.error('[previewEmail Action] Failure:', err)
    return {
      html: '<p style="color: red;">Failed to generate template preview.</p>',
      subject: 'Preview Error',
      templateFound: false,
    }
  }
}

/**
 * Server Action: Sends a test email.
 */
export async function sendTestEmail(toEmail: string, eventType: string, variables: Record<string, string | number | boolean> = {}) {
  try {
    const previewService = new EmailPreviewService()
    const preview = await previewService.renderPreview(eventType, variables, 'brand')
    
    if (!preview.templateFound) {
      return { success: false, error: 'Template not resolved.' }
    }

    const service = EmailFactory.create()
    const result = await service.sendEmail(toEmail, eventType, variables)
    return {
      success: result.success,
      emailQueueId: result.emailQueueId,
      status: result.status,
      error: result.error,
    }
  } catch (err) {
    console.error('[sendTestEmail Action] Failure:', err)
    return { success: false, error: 'Internal Server Action failure.' }
  }
}
