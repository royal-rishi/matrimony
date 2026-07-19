// ============================================================
// NOTIFICATION ORCHESTRATOR
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { NotificationPipeline } from '../pipeline/notification-pipeline'
import type { NotificationEventPayload, EngineResult, PipelineContext } from '../types/engine.types'
import { createNotificationService } from '../../services/notification-service.factory'
import { NotificationLogger } from '../utils/notification-logger'

export class NotificationOrchestrator {
  private readonly pipeline = new NotificationPipeline()

  /**
   * Processes a notification payload through the pipeline, records the results,
   * and dispatches via provider adapters.
   */
  async orchestrate(payload: NotificationEventPayload): Promise<EngineResult> {
    const context: PipelineContext = {
      payload,
      allowedChannels: [],
      finalPriority: payload.priority || 'normal',
      isCancelled: false,
      logs: [],
    }

    // 1. Run pipeline stages (validate -> de-duplicate -> rate-limit -> preferences -> fallbacks)
    const resultContext = await this.pipeline.execute(context)

    if (resultContext.isCancelled) {
      console.warn(`[NotificationOrchestrator] Dispatch suppressed: ${resultContext.cancelReason}`)
      return {
        success: false,
        error: resultContext.cancelReason || 'Pipeline cancelled.',
        channelResults: [],
      }
    }

    const supabase = await createClient()

    try {
      // 2. Resolve template values using the factory NotificationService
      const service = createNotificationService()

      // Resolve event title + body
      const { resolveTemplate } = require('../../config/notification-templates.config')
      const { title, body } = resolveTemplate(payload.eventType, payload.variables || {}, {
        title: payload.metadata?.title,
        body: payload.metadata?.body,
      })

      // 3. Persist core notification entry
      const { data: dbNotif, error: dbErr } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.userId,
          type: payload.eventType,
          title,
          body,
          priority: resultContext.finalPriority,
          channels: resultContext.allowedChannels,
          status: 'pending',
          action_url: payload.metadata?.actionUrl || null,
          image_url: payload.metadata?.imageUrl || null,
        })
        .select('id')
        .maybeSingle()

      if (dbErr || !dbNotif) {
        console.error('[NotificationOrchestrator] Database notification insert failed:', dbErr)
        return { success: false, error: 'Database persistence error.', channelResults: [] }
      }

      // 4. Dispatch using providers factory
      const channelResults = await Promise.all(
        resultContext.allowedChannels.map(async (channel) => {
          const provider = (service as any).providers.find(
            (p: any) => p.channel === channel && p.isEnabled
          )
          if (!provider) {
            return { channel, success: false, error: `Active provider for channel '${channel}' not found.` }
          }

          try {
            const res = await provider.send({
              notificationId: dbNotif.id,
              userId: payload.userId,
              title,
              body,
              actionUrl: payload.metadata?.actionUrl,
              imageUrl: payload.metadata?.imageUrl,
              metadata: {
                ...payload.metadata,
                templateData: payload.variables,
              },
              priority: resultContext.finalPriority,
            })

            const singleRes = res.channelResults[0]
            return {
              channel,
              success: singleRes?.success || false,
              providerMessageId: singleRes?.externalMessageId,
              error: singleRes?.error,
            }
          } catch (err) {
            return {
              channel,
              success: false,
              error: err instanceof Error ? err.message : 'Provider dispatch exception.',
            }
          }
        })
      )

      // 5. Update parent notification status
      const overallSuccess = channelResults.some((c) => c.success)
      await supabase
        .from('notifications')
        .update({
          status: overallSuccess ? 'dispatched' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbNotif.id)

      // 6. Write logs audit
      await NotificationLogger.writeAuditLogs(dbNotif.id, payload.userId, payload.eventType, channelResults)

      return {
        success: overallSuccess,
        notificationId: dbNotif.id,
        channelResults,
      }
    } catch (err) {
      console.error('[NotificationOrchestrator] Orchestration failed:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown orchestrator exception.',
        channelResults: [],
      }
    }
  }
}
export const orchestrator = new NotificationOrchestrator();
