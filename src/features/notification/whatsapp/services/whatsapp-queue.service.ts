// ============================================================
// WHATSAPP QUEUE SERVICE (Worker Engine)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { IWhatsAppProvider } from '../interfaces/whatsapp-provider.interface'
import { WhatsAppLogger } from '../utils/whatsapp.logger'
import type { WhatsAppButton, WhatsAppMediaType } from '../types/whatsapp.types'

export class WhatsAppQueueService {
  constructor(private readonly provider: IWhatsAppProvider) {}

  /**
   * Polls pending WhatsApp jobs from `whatsapp_queue` and processes them sequentially.
   * Employs worker locks to prevent duplicate sends.
   */
  async processQueue(limit: number = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // 1. Fetch pending/scheduled jobs ready to run
    const { data: jobs, error } = await supabase
      .from('whatsapp_queue')
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

    // 2. Lock jobs
    const jobIds = jobs.map((job: any) => job.id)
    const { error: lockError } = await supabase
      .from('whatsapp_queue')
      .update({
        status: 'processing',
        updated_at: now,
      })
      .in('id', jobIds)

    if (lockError) {
      console.error('[WhatsAppQueueService] Failed to lock queue jobs:', lockError)
      return { processed: 0, succeeded: 0, failed: 0 }
    }

    // 3. Process jobs
    for (const job of jobs) {
      processed++
      try {
        let buttons: WhatsAppButton[] = []
        if (job.button_payload) {
          try {
            buttons = typeof job.button_payload === 'string'
              ? JSON.parse(job.button_payload)
              : job.button_payload
          } catch {
            buttons = []
          }
        }

        const payload = {
          toPhone: job.to_phone,
          templateName: job.template_name,
          language: job.template_language,
          variables: job.template_variables,
          mediaUrl: job.media_url || undefined,
          mediaType: (job.media_type as WhatsAppMediaType) || undefined,
          buttons: buttons.length > 0 ? buttons : undefined,
        }

        // Send through provider
        const result = await this.provider.sendWhatsApp(payload)

        // Fetch parent notification details
        const { data: parentNotif } = await supabase
          .from('notifications')
          .select('user_id, type')
          .eq('id', job.notification_id)
          .maybeSingle()

        const userId = parentNotif?.user_id || '00000000-0000-0000-0000-000000000000'
        const eventType = parentNotif?.type || 'system.transactional'

        const logId = await WhatsAppLogger.logAction({
          notificationId: job.notification_id,
          userId,
          event: eventType,
          status: result.success ? 'sent' : 'failed',
          provider: this.provider.providerId,
          recipientPhone: job.to_phone,
          requestPayload: { to: job.to_phone, template: job.template_name },
          retryCount: job.attempts,
          costUnits: Number(job.cost_units || 0),
          providerMessageId: result.providerMessageId,
        })

        if (result.success) {
          succeeded++
          await supabase
            .from('whatsapp_queue')
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
            await WhatsAppLogger.markDelivered(logId, job.notification_id, result.providerMessageId || '', result.providerResponse)
          }
        } else {
          failed++
          await supabase
            .from('whatsapp_queue')
            .update({
              status: 'failed',
              last_error: result.error || 'Provider send failed',
              provider_response: result.providerResponse,
              attempts: job.attempts + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

          if (logId) {
            await WhatsAppLogger.markFailed(logId, job.notification_id, result.error || 'Provider dispatch failed', 'PROVIDER_ERROR', this.provider.providerId)
          }
        }
      } catch (err) {
        failed++
        console.error(`[WhatsAppQueueService] Error processing Wa job ${job.id}:`, err)
        
        await supabase
          .from('whatsapp_queue')
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
