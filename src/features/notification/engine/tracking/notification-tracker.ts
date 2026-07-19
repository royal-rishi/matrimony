// ============================================================
// NOTIFICATION TRACKER SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'

export interface TrackerMetrics {
  queueLatencyMs: number
  dispatchLatencyMs: number
  readLatencyMs?: number
  retryCount: number
}

export class NotificationTracker {
  /**
   * Tracks and resolves delivery latency speeds for a notification message.
   */
  static async getLatencyMetrics(notificationId: string): Promise<TrackerMetrics | null> {
    try {
      const supabase = await createClient()

      // Fetch parent notification
      const { data: notif, error: notifErr } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('id', notificationId)
        .maybeSingle()

      if (notifErr || !notif) return null

      // Fetch logs
      const { data: logs, error: logsErr } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('notification_id', notificationId)

      if (logsErr || !logs || logs.length === 0) return null

      const createdTime = new Date(notif.created_at).getTime()
      
      // Calculate dispatch latency
      const dispatchLog = logs.find((l: any) => l.status === 'dispatched' || l.status === 'delivered')
      const dispatchTime = dispatchLog ? new Date(dispatchLog.created_at).getTime() : Date.now()
      const queueLatencyMs = dispatchTime - createdTime

      // Calculate read latency
      const readLog = logs.find((l: any) => l.status === 'read' || l.status === 'opened')
      const readTime = readLog ? new Date(readLog.created_at).getTime() : undefined
      const readLatencyMs = readTime ? readTime - dispatchTime : undefined

      const maxRetryLog = logs.reduce((max: number, current: any) => {
        return (current.retry_count || 0) > max ? current.retry_count : max
      }, 0)

      return {
        queueLatencyMs,
        dispatchLatencyMs: queueLatencyMs, // in simple routing model
        readLatencyMs,
        retryCount: maxRetryLog,
      }
    } catch (err) {
      console.error('[NotificationTracker] Failed to resolve latency metrics:', err)
      return null
    }
  }
}
