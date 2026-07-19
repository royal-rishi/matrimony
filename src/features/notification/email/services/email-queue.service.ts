// ============================================================
// EMAIL QUEUE SERVICE (Worker Engine)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { IEmailProvider } from '../interfaces/email-provider.interface'
import { EmailLogger } from '../utils/email.logger'
import { TrackingService } from './tracking.service'
import type { EmailAttachment } from '../types/email.types'

export class EmailQueueService {
  constructor(private readonly provider: IEmailProvider) {}

  /**
   * Polls pending/scheduled email jobs from `email_queue` and processes them.
   * Employs worker lock protection to prevent concurrent duplicate dispatching.
   */
  async processQueue(limit: number = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // 1. Fetch pending/scheduled jobs that are ready to run
    const { data: jobs, error } = await supabase
      .from('email_queue')
      .select('*')
      .in('status', ['pending', 'scheduled'])
      .lte('scheduled_for', now)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error || !jobs || jobs.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    // 2. Lock jobs by updating status to processing
    const jobIds = jobs.map((job: any) => job.id)
    const { error: lockError } = await supabase
      .from('email_queue')
      .update({
        status: 'processing',
        updated_at: now,
      })
      .in('id', jobIds)

    if (lockError) {
      console.error('[EmailQueueService] Failed to lock queue jobs:', lockError)
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    // 3. Process locked jobs
    for (const job of jobs) {
      processed++
      try {
        // Enforce link wrapping and tracking pixels if not done already
        const finalHtml = TrackingService.injectOpenTrackingPixel(
          TrackingService.wrapLinks(job.html_body, job.id),
          job.id
        )

        const payload = {
          toEmail: job.to_email,
          toName: job.to_name || undefined,
          subject: job.subject,
          htmlBody: finalHtml,
          fromEmail: job.from_email,
          fromName: job.from_name,
          replyTo: job.reply_to || undefined,
          attachments: job.attachments as EmailAttachment[],
          templateId: job.template_id || undefined,
          variables: job.template_variables || undefined,
        }

        // Send through provider
        const result = await this.provider.send(payload)

        // Fetch parent notification details for auditing
        const { data: parentNotif } = await supabase
          .from('notifications')
          .select('user_id, type')
          .eq('id', job.notification_id)
          .maybeSingle()

        const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
        const eventType = parentNotif?.type || 'system.transactional'

        const logId = await EmailLogger.logAction({
          notificationId: job.notification_id,
          userId,
          event: eventType,
          status: result.success ? 'sent' : 'failed',
          provider: this.provider.providerId,
          recipientEmail: job.to_email,
          requestPayload: { to: job.to_email, subject: job.subject },
          retryCount: job.attempts,
          costUnits: 0.002,
          providerMessageId: result.providerMessageId,
        })

        if (result.success) {
          succeeded++
          // Update queue status to completed
          await supabase
            .from('email_queue')
            .update({
              status: 'completed',
              html_body: finalHtml,
              sent_at: new Date().toISOString(),
              provider_message_id: result.providerMessageId,
              provider_response: result.providerResponse,
              attempts: job.attempts + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          if (logId) {
            await EmailLogger.markDelivered(logId, job.notification_id, result.providerMessageId || '', result.providerResponse)
          }
        } else {
          failed++
          // Update queue status to failed
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              last_error: result.error || 'Provider send failed',
              provider_response: result.providerResponse,
              attempts: job.attempts + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          if (logId) {
            await EmailLogger.markFailed(logId, job.notification_id, result.error || 'Provider dispatch failed', 'PROVIDER_ERROR', this.provider.providerId)
          }
        }
      } catch (err) {
        failed++
        console.error(`[EmailQueueService] Error processing email job ${job.id}:`, err)
        
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            last_error: err instanceof Error ? err.message : 'Unknown exception',
            attempts: job.attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id)
      }
    }

    return { processed, succeeded, failed }
  }
}
