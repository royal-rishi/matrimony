// ============================================================
// PERFORMANCE SERVICE — Phase 10
// Calculates queue processing latencies, worker throughput,
// and P50/P95/P99 execution percentiles.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { PerformanceMetrics, AnalyticsParams } from '../types/observability.types'

export class PerformanceService {
  async getLatencyPercentiles(params: AnalyticsParams): Promise<PerformanceMetrics> {
    const supabase = await createClient()
    const days = params.period === '7d' ? 7 : params.period === '30d' ? 30 : 90
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('delivery_reports')
      .select('first_sent_at, first_delivered_at, channels_failed')
      .gte('created_at', cutoff)
      .not('first_sent_at', 'is', null)
      .not('first_delivered_at', 'is', null)

    if (params.channel) {
      if (params.channel === 'sms') query = query.eq('sms_sent', true)
      else if (params.channel === 'email') query = query.eq('email_sent', true)
      else if (params.channel === 'whatsapp') query = query.eq('whatsapp_sent', true)
    }

    const { data: reports } = await query

    if (!reports || reports.length === 0) {
      return {
        windowMinutes: days * 1440,
        totalProcessed: 0,
        perSecond: 0,
        p50Ms: null,
        p95Ms: null,
        p99Ms: null,
        avgMs: null,
        errorRate: 0,
      }
    }

    const diffs: number[] = []
    let failedCount = 0

    reports.forEach((r: any) => {
      if (r.channels_failed > 0) failedCount++
      const sent = new Date(r.first_sent_at).getTime()
      const deliv = new Date(r.first_delivered_at).getTime()
      const diff = deliv - sent
      if (diff > 0) {
        diffs.push(diff)
      }
    })

    diffs.sort((a, b) => a - b)
    const n = diffs.length

    const p50 = n > 0 ? diffs[Math.floor(n * 0.50)]! : 0
    const p95 = n > 0 ? diffs[Math.floor(n * 0.95)]! : 0
    const p99 = n > 0 ? diffs[Math.floor(n * 0.99)]! : 0
    const sum = diffs.reduce((a, v) => a + v, 0)
    const avg = n > 0 ? sum / n : 0

    const totalProcessed = reports.length
    const timeSpanSec = days * 24 * 3600
    const perSecond = totalProcessed / timeSpanSec

    return {
      windowMinutes: days * 1440,
      totalProcessed,
      perSecond: Number(perSecond.toFixed(4)),
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
      avgMs: Math.round(avg),
      errorRate: Number(((failedCount / totalProcessed) * 100).toFixed(2)),
    }
  }

  async getThroughput(windowMinutes: number = 15): Promise<number> {
    const supabase = await createClient()
    const cutoff = new Date(Date.now() - windowMinutes * 60000).toISOString()

    const { count } = await supabase
      .from('notification_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoff)

    const processed = count ?? 0
    const timeSpanSec = windowMinutes * 60
    return Number((processed / timeSpanSec).toFixed(4))
  }

  async getQueueProcessingTime(period: string): Promise<{ avgMs: number; p95Ms: number }> {
    const supabase = await createClient()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: queueItems } = await supabase
      .from('notification_queue')
      .select('created_at, updated_at')
      .eq('status', 'completed')
      .gte('created_at', cutoff)

    const diffs = (queueItems ?? [])
      .map((item: any) => new Date(item.updated_at).getTime() - new Date(item.created_at).getTime())
      .filter((ms: number) => ms > 0)

    if (diffs.length === 0) return { avgMs: 0, p95Ms: 0 }

    diffs.sort((a: number, b: number) => a - b)
    const avg = diffs.reduce((a: number, v: number) => a + v, 0) / diffs.length
    const p95 = diffs[Math.floor(diffs.length * 0.95)]!

    return {
      avgMs: Math.round(avg),
      p95Ms: p95,
    }
  }

  async savePerformanceSnapshot(snap: PerformanceMetrics): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notification_performance_snapshots')
      .insert({
        window_minutes: snap.windowMinutes,
        total_processed: snap.totalProcessed,
        per_second: snap.perSecond,
        p50_ms: snap.p50Ms,
        p95_ms: snap.p95Ms,
        p99_ms: snap.p99Ms,
        avg_ms: snap.avgMs,
        error_rate: snap.errorRate,
      })

    if (error) throw new Error(error.message)
  }

  async getPerformanceHistory(limit: number = 24): Promise<PerformanceMetrics[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_performance_snapshots')
      .select('*')
      .order('snapshot_at', { ascending: false })
      .limit(limit)

    return (data ?? []).map((row: any) => ({
      windowMinutes: row.window_minutes,
      totalProcessed: row.total_processed,
      perSecond: Number(row.per_second),
      p50Ms: row.p50_ms != null ? Number(row.p50_ms) : null,
      p95Ms: row.p95_ms != null ? Number(row.p95_ms) : null,
      p99Ms: row.p99_ms != null ? Number(row.p99_ms) : null,
      avgMs: row.avg_ms != null ? Number(row.avg_ms) : null,
      errorRate: Number(row.error_rate),
      snapshotAt: row.snapshot_at,
    })).reverse()
  }
}
