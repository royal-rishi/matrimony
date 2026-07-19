// ============================================================
// NOTIFICATION SCHEDULER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { NotificationEventPayload, EngineResult } from '../types/engine.types'
import type { NotificationChannel } from '../../interfaces/notification-provider.interface'
import type { NotificationPriority } from '../../types/notification-database.types'

export class NotificationScheduler {
  /**
   * Schedules a future notification dispatch by writing records to `notification_queue`.
   */
  async schedule(
    payload: NotificationEventPayload,
    scheduledFor: Date
  ): Promise<EngineResult> {
    const supabase = await createClient()

    try {
      // 1. Resolve template message properties
      const { resolveTemplate } = require('../../config/notification-templates.config')
      const { title, body } = resolveTemplate(payload.eventType, payload.variables || {}, {
        title: payload.metadata?.title,
        body: payload.metadata?.body,
      })

      const priority = payload.priority || 'normal'
      const channels = payload.channels || ['in_app']

      // 2. Persist parent notification
      const { data: newNotif, error: notifErr } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.userId,
          type: payload.eventType,
          title,
          body,
          priority,
          channels,
          status: 'pending', // marks as pending until dispatched by worker
          action_url: payload.metadata?.actionUrl || null,
          image_url: payload.metadata?.imageUrl || null,
        })
        .select('id')
        .maybeSingle()

      if (notifErr || !newNotif) {
        console.error('[NotificationScheduler] Failed to insert notifications record:', notifErr)
        return { success: false, error: 'Database save error.', channelResults: [] }
      }

      // 3. Insert into notification_queue
      const queueEntries = channels.map((chan) => ({
        notification_id: newNotif.id,
        priority: priority as NotificationPriority,
        status: 'scheduled' as const,
        channel: chan as NotificationChannel,
        scheduled_for: scheduledFor.toISOString(),
        attempts: 0,
        max_attempts: 3,
        metadata: {
          variables: payload.variables,
          metadata: payload.metadata,
        },
      }))

      const { error: queueErr } = await supabase
        .from('notification_queue')
        .insert(queueEntries)

      if (queueErr) {
        console.error('[NotificationScheduler] Failed to write notification_queue:', queueErr)
        return { success: false, error: 'Queue scheduling save error.', channelResults: [] }
      }

      const channelResults = channels.map((c) => ({
        channel: c,
        success: true,
      }))

      return {
        success: true,
        notificationId: newNotif.id,
        channelResults,
      }
    } catch (err) {
      console.error('[NotificationScheduler] Schedule exception:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown scheduling exception.',
        channelResults: [],
      }
    }
  }

  /**
   * Cancels a scheduled notification in the queue by updating status to 'cancelled'.
   */
  async cancel(notificationId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      // Update in notification_queue
      const { error: queueErr } = await supabase
        .from('notification_queue')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('notification_id', notificationId)
        .in('status', ['pending', 'scheduled'])

      // Update parent notification status
      const { error: notifErr } = await supabase
        .from('notifications')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', notificationId)

      return !queueErr && !notifErr
    } catch (err) {
      console.error('[NotificationScheduler] Cancel exception:', err)
      return false
    }
  }
}
export const scheduler = new NotificationScheduler();
