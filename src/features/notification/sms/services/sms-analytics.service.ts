// ============================================================
// SMS ANALYTICS & ROLLUP SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { ANALYTICS_CONFIG } from '../config/analytics.config'

export class SMSAnalyticsService {
  /**
   * Triggers the database-level rollup function for a specific date.
   * Compiles data from partitioned notification_logs into notification_analytics.
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
        console.error(`[SMSAnalyticsService] Failed to upsert daily analytics for ${dateStr}:`, error)
        return false
      }

      return true
    } catch (err) {
      console.error('[SMSAnalyticsService] Exception during analytics rollup:', err)
      return false
    }
  }

  /**
   * Fetches the provider performance report from provider_performance_view.
   */
  async getProviderPerformance(): Promise<any[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('provider_performance_view')
        .select('*')
        .eq('channel', 'sms')

      if (error) {
        console.error('[SMSAnalyticsService] Failed to fetch provider performance:', error)
        return []
      }

      return data || []
    } catch (err) {
      console.error('[SMSAnalyticsService] Exception fetching performance report:', err)
      return []
    }
  }

  /**
   * Fetches monthly volume and cost analytics.
   */
  async getMonthlyUsageReport(year: number, month: number): Promise<{ totalVolume: number; totalCost: number }> {
    try {
      const supabase = await createClient()
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('notification_analytics')
        .select('total_sent, total_cost')
        .eq('channel', 'sms')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error || !data) {
        console.error('[SMSAnalyticsService] Failed to fetch monthly analytics data:', error)
        return { totalVolume: 0, totalCost: 0 }
      }

      const totalVolume = data.reduce((acc: number, row: any) => acc + (row.total_sent || 0), 0)
      const totalCost = data.reduce((acc: number, row: any) => acc + Number(row.total_cost || 0), 0)

      return { totalVolume, totalCost }
    } catch (err) {
      console.error('[SMSAnalyticsService] Exception fetching monthly report:', err)
      return { totalVolume: 0, totalCost: 0 }
    }
  }
}
