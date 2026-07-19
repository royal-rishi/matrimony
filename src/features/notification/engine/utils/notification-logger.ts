// ============================================================
// CENTRAL NOTIFICATION LOG ENGINE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { EngineChannelResult } from '../types/engine.types'
import type { DeliveryStatus, NotificationEvent } from '../../types/notification-database.types'

export class NotificationLogger {
  /**
   * Writes detailed dispatch logs for all channel providers to the database.
   */
  static async writeAuditLogs(
    notificationId: string,
    userId: string,
    eventType: string,
    channelResults: EngineChannelResult[]
  ): Promise<void> {
    try {
      const supabase = await createClient()

      const logInserts = channelResults.map((res) => ({
        notification_id: notificationId,
        user_id: userId,
        event: eventType as NotificationEvent,
        channel: res.channel,
        status: (res.success ? 'dispatched' : 'failed') as DeliveryStatus,
        provider: `${res.channel}-engine-dispatch`,
        request_payload: { eventType, channel: res.channel },
        response_payload: res.success ? { success: true } : null,
        error_message: res.error || null,
        provider_message_id: res.providerMessageId || null,
        retry_count: 0,
      }))

      if (logInserts.length > 0) {
        await supabase.from('notification_logs').insert(logInserts)
      }
    } catch (err) {
      console.error('[NotificationLogger] Failed to write notification_logs:', err)
    }
  }
}
