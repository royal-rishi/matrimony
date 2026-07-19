// ============================================================
// WHATSAPP RETRY & DLQ SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { RETRY_CONFIG } from '../config/retry.config'

export class WhatsAppRetryService {
  /**
   * Processes failed WhatsApp queue rows:
   *   - If attempts < 5: schedules next retry attempt using backoff.
   *   - If attempts >= 5: moves to DLQ failed_notifications and sets status = 'dead_lettered'.
   */
  async processFailedJobs(): Promise<{ retried: number; deadLettered: number }> {
    const supabase = await createClient()

    // 1. Fetch failed jobs eligible for retry
    const { data: failedJobs, error } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('status', 'failed')
      .lt('attempts', RETRY_CONFIG.maxAttempts)

    if (error) {
      console.error('[WhatsAppRetryService] Error fetching failed jobs:', error)
      return { retried: 0, deadLettered: 0 }
    }

    let retried = 0

    // 2. Schedule retry
    for (const job of failedJobs) {
      const attemptIdx = Math.min(job.attempts - 1, RETRY_CONFIG.retryDelaysSeconds.length - 1)
      const delaySeconds = RETRY_CONFIG.retryDelaysSeconds[attemptIdx] || 60
      const nextRun = new Date(Date.now() + delaySeconds * 1000).toISOString()

      const { error: updateErr } = await supabase
        .from('whatsapp_queue')
        .update({
          status: 'scheduled',
          scheduled_for: nextRun,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      if (!updateErr) {
        retried++
      }
    }

    // 3. Process exhausted jobs (DLQ)
    const { data: exhaustedJobs, error: fetchExhaustedErr } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('status', 'failed')
      .gte('attempts', RETRY_CONFIG.maxAttempts)

    if (fetchExhaustedErr) {
      console.error('[WhatsAppRetryService] Error fetching exhausted jobs:', fetchExhaustedErr)
      return { retried, deadLettered: 0 }
    }

    let deadLettered = 0

    for (const job of exhaustedJobs) {
      const { error: updateErr } = await supabase
        .from('whatsapp_queue')
        .update({
          status: 'dead_lettered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      if (updateErr) continue

      // Fetch parent details
      const { data: parentNotif } = await supabase
        .from('notifications')
        .select('user_id, type')
        .eq('id', job.notification_id)
        .maybeSingle()

      const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
      const eventType = parentNotif?.type || 'system.transactional'

      // Move to DLQ failed_notifications
      const { error: dlqErr } = await supabase
        .from('failed_notifications')
        .insert({
          notification_id: job.notification_id,
          user_id: userId,
          event: eventType,
          channel: 'whatsapp',
          provider: job.provider,
          failure_reason: job.last_error || 'Maximum retry limit reached.',
          provider_error_code: 'MAX_RETRIES_EXHAUSTED',
          provider_error_msg: job.last_error || null,
          request_payload: { to_phone: job.to_phone, template_name: job.template_name, attempts: job.attempts },
          retry_count: job.attempts,
          max_retries: job.max_attempts,
          is_resolved: false,
        })

      if (!dlqErr) {
        deadLettered++
      }
    }

    return { retried, deadLettered }
  }
}
