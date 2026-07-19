// ============================================================
// PREFERENCE CHANGE AUDIT LOGGER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { DeliveryStatus, NotificationEvent } from '../../types/notification-database.types'

export class PreferenceLogger {
  /**
   * Logs a preference change transaction to the audit logs database.
   */
  static async logChange(userId: string, changeSummary: Record<string, any>): Promise<void> {
    try {
      const supabase = await createClient()

      await supabase.from('notification_logs').insert({
        notification_id: '00000000-0000-0000-0000-000000000000', // System level
        user_id: userId,
        event: 'system.transactional' as NotificationEvent,
        channel: 'in_app' as const,
        status: 'delivered' as DeliveryStatus,
        provider: 'preferences-center',
        request_payload: { action: 'update_preferences', updates: changeSummary },
        response_payload: { success: true },
        delivered_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('[PreferenceLogger] Failed to write preferences audit log:', err)
    }
  }
}
