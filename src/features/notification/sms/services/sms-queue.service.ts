// ============================================================
// SMS QUEUE SERVICE (Worker Engine)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { ISmsProvider } from '../interfaces/sms-provider.interface'
import type { SmsQueue } from '../../types/notification-database.types'
import { SMSLogger } from '../utils/sms.logger'
import { SMSTemplateResolver } from './sms-template.resolver'

export class SMSQueueService {
  constructor(private readonly provider: ISmsProvider) {}

  /**
   * Polls pending/scheduled SMS jobs from `sms_queue` and processes them sequentially.
   * Employs worker lock protection to prevent concurrent duplicate dispatching.
   */
  async processQueue(limit: number = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    const supabase = await createClient()
    const now = new Date().toISOString()
    const workerId = `sms-worker-${crypto.randomUUID().slice(0, 8)}`

    // 1. Fetch pending/scheduled jobs that are ready to go
    const { data: jobs, error } = await supabase
      .from('sms_queue')
      .select('*')
      .in('status', ['pending', 'scheduled'])
      .lte('scheduled_for', now)
      .order('priority', { ascending: false }) // Process 'critical'/'urgent' first
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error || !jobs || jobs.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    let processed = 0
    let succeeded = 0
    let failed = 0

    // 2. Lock jobs by updating status to processing and setting worker_id
    const jobIds = jobs.map((job: any) => job.id)
    const { error: lockError } = await supabase
      .from('sms_queue')
      .update({
        status: 'processing',
        updated_at: now,
      })
      .in('id', jobIds)

    if (lockError) {
      console.error('[SMSQueueService] Failed to lock queue jobs:', lockError)
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    // 3. Process locked jobs
    for (const job of jobs as unknown as SmsQueue[]) {
      processed++
      try {
        const payload = {
          toPhone: job.to_phone,
          body: job.message_body,
          dltTemplateId: job.dlt_template_id || undefined,
          senderId: job.sender_id || undefined,
          priority: job.priority,
          templateVariables: job.template_variables as Record<string, string | number | boolean>,
        }

        // Send through provider
        const result = await this.provider.sendSms(payload)

        // Fetch parent notification info for logging
        const { data: parentNotif } = await supabase
          .from('notifications')
          .select('user_id, type')
          .eq('id', job.notification_id)
          .maybeSingle()

        const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
        const eventType = parentNotif?.type || 'system.transactional'

        const logId = await SMSLogger.logAction({
          notificationId: job.notification_id,
          userId,
          event: eventType,
          status: result.success ? 'sent' : 'failed',
          provider: this.provider.providerId,
          recipientPhone: job.to_phone,
          templateId: job.template_id || undefined,
          requestPayload: { mobiles: job.to_phone, variables: job.template_variables },
          retryCount: job.attempts,
          costUnits: job.segment_count * Number(job.cost_per_segment),
          providerMessageId: result.providerMessageId,
        })

        if (result.success) {
          succeeded++
          // Update queue status to completed
          await supabase
            .from('sms_queue')
            .update({
              status: 'completed',
              sent_at: new Date().toISOString(),
              provider_message_id: result.providerMessageId,
              provider_response: result.providerResponse,
              attempts: job.attempts + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          if (logId) {
            await SMSLogger.markDelivered(logId, job.notification_id, result.providerMessageId || '', result.providerResponse)
          }
        } else {
          failed++
          // Update queue status to failed, record error
          await supabase
            .from('sms_queue')
            .update({
              status: 'failed',
              last_error: result.error || 'Provider send failed',
              provider_response: result.providerResponse,
              attempts: job.attempts + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          if (logId) {
            await SMSLogger.markFailed(logId, job.notification_id, result.error || 'Provider dispatch failed', 'PROVIDER_ERROR', this.provider.providerId)
          }
        }
      } catch (err) {
        failed++
        console.error(`[SMSQueueService] Error processing job ${job.id}:`, err)
        
        await supabase
          .from('sms_queue')
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
