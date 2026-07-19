// ============================================================
// PIPELINE MIDDLEWARE (Validation, Duplicate Checks, Rate Limits)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { PipelineContext } from '../types/engine.types'
import { ENGINE_CONFIG } from '../config/engine.config'

export class NotificationMiddleware {
  /**
   * Syntactic and structure validation.
   */
  static async validatePayload(context: PipelineContext): Promise<PipelineContext> {
    const { userId, eventType } = context.payload

    if (!userId || !eventType) {
      context.isCancelled = true
      context.cancelReason = 'Validation failed: Missing userId or eventType.'
      context.logs.push('Validation Stage: FAILED - missing key parameters.')
      return context
    }

    context.logs.push('Validation Stage: PASSED.')
    return context
  }

  /**
   * Enforces rolling rate limiting rules.
   */
  static async enforceRateLimit(context: PipelineContext): Promise<PipelineContext> {
    if (context.isCancelled) return context

    const { userId } = context.payload
    const supabase = await createClient()

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString()

    try {
      // 1. Minute Limit check
      const { count: minCount, error: minErr } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('created_at', oneMinuteAgo)

      if (!minErr && minCount !== null && minCount >= ENGINE_CONFIG.rateLimits.maxPerUserPerMinute) {
        context.isCancelled = true
        context.cancelReason = `Rate limit exceeded: Max ${ENGINE_CONFIG.rateLimits.maxPerUserPerMinute} notifications per minute.`
        context.logs.push('RateLimit Stage: BLOCKED - per-minute limit reached.')
        return context
      }

      // 2. Hour Limit check
      const { count: hrCount, error: hrErr } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('created_at', oneHourAgo)

      if (!hrErr && hrCount !== null && hrCount >= ENGINE_CONFIG.rateLimits.maxPerUserPerHour) {
        context.isCancelled = true
        context.cancelReason = `Rate limit exceeded: Max ${ENGINE_CONFIG.rateLimits.maxPerUserPerHour} notifications per hour.`
        context.logs.push('RateLimit Stage: BLOCKED - per-hour limit reached.')
        return context
      }

      context.logs.push('RateLimit Stage: PASSED.')
    } catch (err) {
      console.warn('[NotificationMiddleware] Rate limit DB error, defaulting to PASS:', err)
      context.logs.push('RateLimit Stage: PASSED (warning: DB limit check skipped).')
    }

    return context
  }

  /**
   * Enforces duplicate send suppression rules.
   */
  static async preventDuplicates(context: PipelineContext): Promise<PipelineContext> {
    if (context.isCancelled) return context

    const { userId, eventType } = context.payload
    const supabase = await createClient()

    const dedupCutoff = new Date(Date.now() - ENGINE_CONFIG.dedupWindowSeconds * 1000).toISOString()

    try {
      const { data: recent, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', eventType)
        .gt('created_at', dedupCutoff)
        .limit(1)

      if (!error && recent && recent.length > 0) {
        context.isCancelled = true
        context.cancelReason = `Duplicate suppression active: Event '${eventType}' was recently sent to user ${userId} within the last ${ENGINE_CONFIG.dedupWindowSeconds} seconds.`
        context.logs.push('Duplicate Stage: SUPPRESSED - identical recent event.')
        return context
      }

      context.logs.push('Duplicate Stage: PASSED.')
    } catch (err) {
      console.warn('[NotificationMiddleware] Duplicate check skipped due to warning:', err)
      context.logs.push('Duplicate Stage: PASSED (warning: DB check skipped).')
    }

    return context
  }
}
