// ============================================================
// CENTRAL NOTIFICATION TELEMETRY & ANALYTICS
// ============================================================

import { createClient } from '@/lib/supabase/server'

export interface ChannelPerformanceStats {
  channel: string
  totalSent: number
  successRate: number
  failureRate: number
  avgLatencyMs: number
  totalCost: number
}

export class NotificationAnalytics {
  /**
   * Compiles analytics across active communication channels (SMS, Email, WhatsApp, In-App).
   */
  static async getPerformanceStats(startDate: string, endDate: string): Promise<ChannelPerformanceStats[]> {
    try {
      const supabase = await createClient()

      // Fetch analytics records
      const { data, error } = await supabase
        .from('notification_analytics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error || !data) {
        return []
      }

      // Group metrics by channel
      const groups = new Map<string, any[]>()
      for (const row of data) {
        const chan = row.channel || 'unknown'
        if (!groups.has(chan)) {
          groups.set(chan, [])
        }
        groups.get(chan)!.push(row)
      }

      const performanceStats: ChannelPerformanceStats[] = []

      for (const [channel, rows] of groups.entries()) {
        const totalSent = rows.reduce((acc, r) => acc + (r.total_sent || 0), 0)
        const totalDelivered = rows.reduce((acc, r) => acc + (r.total_delivered || 0), 0)
        const totalFailed = rows.reduce((acc, r) => acc + (r.total_failed || 0), 0)
        const totalCost = rows.reduce((acc, r) => acc + Number(r.total_cost || 0), 0)

        const totalAttempts = totalDelivered + totalFailed
        const successRate = totalAttempts > 0 ? (totalDelivered / totalAttempts) * 100 : 0
        const failureRate = totalAttempts > 0 ? (totalFailed / totalAttempts) * 100 : 0

        performanceStats.push({
          channel,
          totalSent,
          successRate: Number(successRate.toFixed(2)),
          failureRate: Number(failureRate.toFixed(2)),
          avgLatencyMs: 250, // Nominal mock value
          totalCost: Number(totalCost.toFixed(4)),
        })
      }

      return performanceStats
    } catch (err) {
      console.error('[NotificationAnalytics] Error compiling channel telemetry:', err)
      return []
    }
  }
}
