// ============================================================
// EMAIL ANALYTICS & ROLLUP SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { ANALYTICS_CONFIG } from '../config/analytics.config'

export class EmailAnalyticsService {
  /**
   * Triggers the database rollup function for email logs for a specific date.
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
        console.error(`[EmailAnalyticsService] Failed rollup for ${dateStr}:`, error)
        return false
      }

      return true
    } catch (err) {
      console.error('[EmailAnalyticsService] Exception in analytics rollup:', err)
      return false
    }
  }

  /**
   * Fetches performance metrics (open rates, click rates, etc.).
   */
  async getPerformanceMetrics(startDate: string, endDate: string): Promise<any> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('notification_analytics')
        .select('*')
        .eq('channel', 'email')
        .gte('date', startDate)
        .lte('date', endDate)

      if (error || !data) {
        return { totalSent: 0, totalDelivered: 0, openRate: 0, clickRate: 0 }
      }

      const totalSent = data.reduce((acc: number, row: any) => acc + (row.total_sent || 0), 0)
      const totalDelivered = data.reduce((acc: number, row: any) => acc + (row.total_delivered || 0), 0)
      const totalOpened = data.reduce((acc: number, row: any) => acc + (row.total_opened || 0), 0)
      const totalClicked = data.reduce((acc: number, row: any) => acc + (row.total_clicked || 0), 0)
      const totalBounced = data.reduce((acc: number, row: any) => acc + (row.total_failed || 0), 0) // Treat failed as bounce for simplicity

      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
      const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
      const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0

      return {
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        openRate: Number(openRate.toFixed(2)),
        clickRate: Number(clickRate.toFixed(2)),
        bounceRate: Number(bounceRate.toFixed(2)),
      }
    } catch (err) {
      console.error('[EmailAnalyticsService] Error fetching metrics:', err)
      return { totalSent: 0, totalDelivered: 0, openRate: 0, clickRate: 0 }
    }
  }
}
