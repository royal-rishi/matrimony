// ============================================================
// WHATSAPP TELEMETRY & ANALYTICS SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { ANALYTICS_CONFIG } from '../config/analytics.config'

export class WhatsAppAnalyticsService {
  /**
   * Triggers the database-level daily rollup function.
   */
  async rollupDailyAnalytics(date: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)): Promise<boolean> {
    if (!ANALYTICS_CONFIG.enabled) return false

    try {
      const supabase = await createClient()
      const dateStr = date.toISOString().split('T')[0]

      const { error } = await supabase.rpc('fn_upsert_daily_analytics', {
        p_date: dateStr,
      })

      if (error) {
        console.error(`[WhatsAppAnalyticsService] Rollup failed for Wa metrics on ${dateStr}:`, error)
        return false
      }

      return true
    } catch (err) {
      console.error('[WhatsAppAnalyticsService] Exception in Wa daily metrics rollup:', err)
      return false
    }
  }

  /**
   * Retrieves provider deliverability report from database.
   */
  async getWhatsAppUsageStats(startDate: string, endDate: string): Promise<any> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('notification_analytics')
        .select('*')
        .eq('channel', 'whatsapp')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error || !data) {
        return { totalSent: 0, totalDelivered: 0, readRate: 0, cost: 0 }
      }

      const totalSent = data.reduce((acc: number, row: any) => acc + (row.total_sent || 0), 0)
      const totalDelivered = data.reduce((acc: number, row: any) => acc + (row.total_delivered || 0), 0)
      const totalRead = data.reduce((acc: number, row: any) => acc + (row.total_opened || 0), 0) // read maps to opened in general analytics schema
      const totalCost = data.reduce((acc: number, row: any) => acc + Number(row.total_cost || 0), 0)

      const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0

      return {
        totalSent,
        totalDelivered,
        totalRead,
        readRate: Number(readRate.toFixed(2)),
        totalCost,
      }
    } catch (err) {
      console.error('[WhatsAppAnalyticsService] Error fetching Wa metrics:', err)
      return { totalSent: 0, totalDelivered: 0, readRate: 0, cost: 0 }
    }
  }
}
