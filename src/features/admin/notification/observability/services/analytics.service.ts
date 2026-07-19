// ============================================================
// ANALYTICS SERVICE — Phase 10
// Queries notification_logs, notification_analytics, otp_requests
// delivery_reports for comprehensive analytics.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type {
  AnalyticsParams,
  ChannelAnalytics,
  CategoryBreakdown,
  DailyVolume,
  EmailAnalytics,
  ExecutiveSummary,
  HourlyVolume,
  OTPAnalytics,
  ProviderComparison,
  SMSAnalytics,
  WhatsAppAnalytics,
} from '../types/observability.types'

function periodToDays(period: string): number {
  switch (period) {
    case '1d':  return 1
    case '7d':  return 7
    case '30d': return 30
    case '90d': return 90
    default:    return 7
  }
}

function periodFromDate(period: string): string {
  const d = new Date()
  d.setDate(d.getDate() - periodToDays(period))
  return d.toISOString()
}

export class AnalyticsService {
  async getExecutiveSummary(): Promise<ExecutiveSummary> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]!
    const todayStart = `${today}T00:00:00.000Z`
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const { data: analyticsRow } = await supabase
      .from('notification_analytics')
      .select('*')
      .eq('date', today)
      .is('channel', null)
      .is('event', null)
      .is('provider', null)
      .maybeSingle()

    const { count: queueSize } = await supabase
      .from('notification_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: retrySize } = await supabase
      .from('retry_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled')

    const { count: dlqSize } = await supabase
      .from('failed_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_resolved', false)

    const { count: activeAlerts } = await supabase
      .from('notification_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('is_triggered', true)
      .is('resolved_at', null)

    const { data: todayCostData } = await supabase
      .from('notification_logs')
      .select('cost_units')
      .gte('created_at', todayStart)

    const costToday = Array.isArray(todayCostData)
      ? todayCostData.reduce((s: number, r: any) => s + Number(r.cost_units ?? 0), 0)
      : 0

    const { data: monthCostData } = await supabase
      .from('notification_analytics')
      .select('total_cost')
      .gte('date', monthStart.split('T')[0]!)
      .is('channel', null)

    const costMonth = Array.isArray(monthCostData)
      ? monthCostData.reduce((s: number, r: any) => s + Number(r.total_cost ?? 0), 0)
      : 0

    const { count: otpTotal } = await supabase
      .from('otp_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart)

    const { count: otpVerified } = await supabase
      .from('otp_requests')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .not('verified_at', 'is', null)

    const totalSent = analyticsRow?.total_sent ?? 0
    const delivered  = analyticsRow?.delivered  ?? 0
    const failed     = analyticsRow?.failed     ?? 0
    const deliveryRate = totalSent > 0 ? Number(((delivered / totalSent) * 100).toFixed(2)) : 0
    const failureRate  = totalSent > 0 ? Number(((failed  / totalSent) * 100).toFixed(2)) : 0

    return {
      date: today,
      totalSent,
      totalDelivered: delivered,
      totalFailed: failed,
      deliveryRate,
      failureRate,
      totalOTP: otpTotal ?? 0,
      otpVerified: otpVerified ?? 0,
      totalSMS: analyticsRow?.sms_sent ?? 0,
      totalEmail: analyticsRow?.emails_sent ?? 0,
      totalWhatsApp: analyticsRow?.whatsapp_sent ?? 0,
      totalInApp: analyticsRow?.in_app_sent ?? 0,
      costToday,
      costMonth,
      queueSize: queueSize ?? 0,
      retryQueueSize: retrySize ?? 0,
      dlqSize: dlqSize ?? 0,
      avgDeliveryTimeMs: 0,
      activeAlerts: activeAlerts ?? 0,
    }
  }

  async getChannelAnalytics(params: AnalyticsParams): Promise<ChannelAnalytics[]> {
    const supabase = await createClient()
    const from = periodFromDate(params.period)

    let query = supabase
      .from('notification_logs')
      .select('channel, status, cost_units, delivered_at, created_at')
      .gte('created_at', from)

    if (params.channel) query = query.eq('channel', params.channel)
    if (params.provider) query = query.eq('provider', params.provider)

    const { data: logs } = await query

    if (!logs) return []

    const map: Record<string, {
      sent: number; delivered: number; failed: number
      latencies: number[]; cost: number
    }> = {}

    for (const log of logs) {
      const ch = log.channel ?? 'unknown'
      if (!map[ch]) map[ch] = { sent: 0, delivered: 0, failed: 0, latencies: [], cost: 0 }
      map[ch]!.sent++
      map[ch]!.cost += Number(log.cost_units ?? 0)

      const isDelivered = ['delivered', 'dispatched', 'sent', 'opened', 'clicked', 'read'].includes(log.status)
      if (isDelivered) {
        map[ch]!.delivered++
        if (log.delivered_at && log.created_at) {
          const latMs = new Date(log.delivered_at).getTime() - new Date(log.created_at).getTime()
          if (latMs > 0) map[ch]!.latencies.push(latMs)
        }
      }
      if (log.status === 'failed' || log.status === 'bounced') map[ch]!.failed++
    }

    return Object.entries(map).map(([channel, d]) => ({
      channel,
      sent: d.sent,
      delivered: d.delivered,
      failed: d.failed,
      deliveryRate: d.sent > 0 ? Number(((d.delivered / d.sent) * 100).toFixed(2)) : 0,
      avgLatencyMs: d.latencies.length > 0
        ? Math.round(d.latencies.reduce((a, v) => a + v, 0) / d.latencies.length)
        : 0,
      costUnits: Number(d.cost.toFixed(4)),
    }))
  }

  async getOTPAnalytics(period: string): Promise<OTPAnalytics> {
    const supabase = await createClient()
    const from = periodFromDate(period)

    const { data: otpRows } = await supabase
      .from('otp_requests')
      .select('verified_at, expires_at, attempts, created_at')
      .gte('created_at', from)

    const { count: rateLimitHits } = await supabase
      .from('otp_blocks')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', from)

    const now = new Date()
    let requested = 0, verified = 0, failed = 0, expired = 0, abuse = 0

    for (const row of otpRows ?? []) {
      requested++
      if (row.verified_at) {
        verified++
      } else if (new Date(row.expires_at) < now) {
        expired++
      } else if ((row.attempts ?? 0) >= 3) {
        failed++
      }
      if ((row.attempts ?? 0) > 5) abuse++
    }

    return {
      period,
      requested,
      verified,
      failed,
      expired,
      abuseSuspected: abuse,
      rateLimitHits: rateLimitHits ?? 0,
      verificationRate: requested > 0 ? Number(((verified / requested) * 100).toFixed(2)) : 0,
    }
  }

  async getHourlyVolume(date: string): Promise<HourlyVolume[]> {
    const supabase = await createClient()
    const from = `${date}T00:00:00.000Z`
    const to   = `${date}T23:59:59.999Z`

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('status, created_at')
      .gte('created_at', from)
      .lte('created_at', to)

    const hourMap: Record<number, { total: number; delivered: number; failed: number }> = {}
    for (let h = 0; h < 24; h++) hourMap[h] = { total: 0, delivered: 0, failed: 0 }

    for (const log of logs ?? []) {
      const h = new Date(log.created_at).getUTCHours()
      if (hourMap[h]) {
        hourMap[h]!.total++
        const isDelivered = ['delivered', 'opened', 'clicked', 'read', 'sent'].includes(log.status)
        if (isDelivered) hourMap[h]!.delivered++
        if (['failed', 'bounced'].includes(log.status)) hourMap[h]!.failed++
      }
    }

    return Object.entries(hourMap).map(([h, d]) => ({
      hour: Number(h),
      label: `${String(h).padStart(2, '0')}:00`,
      ...d,
    }))
  }

  async getDailyVolume(period: string): Promise<DailyVolume[]> {
    const supabase = await createClient()
    const days = periodToDays(period)
    const from = new Date()
    from.setDate(from.getDate() - days)
    const fromDate = from.toISOString().split('T')[0]!

    const { data: rows } = await supabase
      .from('notification_analytics')
      .select('date, total_sent, emails_sent, sms_sent, whatsapp_sent, in_app_sent, otp_sent, delivered, delivery_rate')
      .gte('date', fromDate)
      .is('channel', null)
      .is('event', null)
      .is('provider', null)
      .order('date', { ascending: true })

    return (rows ?? []).map((r: any) => ({
      date: r.date,
      total: r.total_sent ?? 0,
      email: r.emails_sent ?? 0,
      sms: r.sms_sent ?? 0,
      whatsapp: r.whatsapp_sent ?? 0,
      inApp: r.in_app_sent ?? 0,
      otp: r.otp_sent ?? 0,
      deliveryRate: Number(r.delivery_rate ?? 0),
    }))
  }

  async getEmailAnalytics(params: AnalyticsParams): Promise<EmailAnalytics> {
    const supabase = await createClient()
    const from = periodFromDate(params.period)

    const { data: reports } = await supabase
      .from('delivery_reports')
      .select('email_sent, email_delivered, email_opened, email_clicked, email_bounced')
      .gte('created_at', from)

    let sent = 0, delivered = 0, opened = 0, clicked = 0, bounced = 0

    for (const r of reports ?? []) {
      if (r.email_sent) { sent++; if (r.email_delivered) delivered++; }
      if (r.email_opened) opened++
      if (r.email_clicked) clicked++
      if (r.email_bounced) bounced++
    }

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      spam: 0,
      unsubscribed: 0,
      openRate:     sent > 0    ? Number(((opened   / sent)    * 100).toFixed(2)) : 0,
      ctr:          opened > 0  ? Number(((clicked  / opened)  * 100).toFixed(2)) : 0,
      deliveryRate: sent > 0    ? Number(((delivered / sent)   * 100).toFixed(2)) : 0,
    }
  }

  async getSMSAnalytics(params: AnalyticsParams): Promise<SMSAnalytics> {
    const supabase = await createClient()
    const from = periodFromDate(params.period)

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('status, cost_units, delivered_at, created_at, retry_count')
      .eq('channel', 'sms')
      .gte('created_at', from)

    let sent = 0, delivered = 0, failed = 0, retried = 0, totalCost = 0
    const latencies: number[] = []

    for (const log of logs ?? []) {
      sent++
      totalCost += Number(log.cost_units ?? 0)
      if (log.retry_count > 0) retried++

      if (['delivered', 'sent'].includes(log.status)) {
        delivered++
        if (log.delivered_at && log.created_at) {
          const ms = new Date(log.delivered_at).getTime() - new Date(log.created_at).getTime()
          if (ms > 0) latencies.push(ms)
        }
      }
      if (['failed', 'bounced', 'rejected'].includes(log.status)) failed++
    }

    return {
      sent,
      delivered,
      failed,
      retried,
      avgLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, v) => a + v, 0) / latencies.length) : 0,
      totalCost: Number(totalCost.toFixed(4)),
      avgCostPerMsg: sent > 0 ? Number((totalCost / sent).toFixed(4)) : 0,
    }
  }

  async getWhatsAppAnalytics(params: AnalyticsParams): Promise<WhatsAppAnalytics> {
    const supabase = await createClient()
    const from = periodFromDate(params.period)

    const { data: reports } = await supabase
      .from('delivery_reports')
      .select('whatsapp_sent, whatsapp_delivered, whatsapp_read, total_cost')
      .gte('created_at', from)

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('status, cost_units')
      .eq('channel', 'whatsapp')
      .gte('created_at', from)

    let sent = 0, delivered = 0, read = 0, totalCost = 0
    for (const r of reports ?? []) {
      if (r.whatsapp_sent)     sent++
      if (r.whatsapp_delivered) delivered++
      if (r.whatsapp_read)      read++
      totalCost += Number(r.total_cost ?? 0)
    }
    const failed = (logs ?? []).filter((l: any) => ['failed', 'bounced'].includes(l.status)).length

    return {
      sent,
      delivered,
      read,
      replied: 0,
      failed,
      deliveryRate: sent > 0 ? Number(((delivered / sent) * 100).toFixed(2)) : 0,
      readRate:     delivered > 0 ? Number(((read / delivered) * 100).toFixed(2)) : 0,
      totalCost: Number(totalCost.toFixed(4)),
    }
  }

  async getCategoryBreakdown(period: string): Promise<CategoryBreakdown[]> {
    const supabase = await createClient()
    const from = periodFromDate(period)

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('event, channel, status')
      .gte('created_at', from)

    const map: Record<string, { count: number; delivered: number; channel: string }> = {}

    for (const log of logs ?? []) {
      const key = log.event
      if (!map[key]) map[key] = { count: 0, delivered: 0, channel: log.channel }
      map[key]!.count++
      if (['delivered', 'sent', 'opened', 'read'].includes(log.status)) map[key]!.delivered++
    }

    return Object.entries(map)
      .map(([event, d]) => ({
        event,
        count: d.count,
        deliveryRate: d.count > 0 ? Number(((d.delivered / d.count) * 100).toFixed(2)) : 0,
        channel: d.channel,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }

  async getProviderComparison(period: string): Promise<ProviderComparison[]> {
    const supabase = await createClient()
    const from = periodFromDate(period)

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('provider, status, cost_units, delivered_at, created_at')
      .gte('created_at', from)
      .not('provider', 'is', null)

    const map: Record<string, {
      sent: number; delivered: number; latencies: number[]; cost: number
    }> = {}

    for (const log of logs ?? []) {
      const p = log.provider ?? 'unknown'
      if (!map[p]) map[p] = { sent: 0, delivered: 0, latencies: [], cost: 0 }
      map[p]!.sent++
      map[p]!.cost += Number(log.cost_units ?? 0)
      if (['delivered', 'sent', 'opened'].includes(log.status)) {
        map[p]!.delivered++
        if (log.delivered_at && log.created_at) {
          const ms = new Date(log.delivered_at).getTime() - new Date(log.created_at).getTime()
          if (ms > 0) map[p]!.latencies.push(ms)
        }
      }
    }

    return Object.entries(map).map(([provider, d]) => ({
      provider,
      sent: d.sent,
      delivered: d.delivered,
      successRate: d.sent > 0 ? Number(((d.delivered / d.sent) * 100).toFixed(2)) : 0,
      avgLatencyMs: d.latencies.length > 0
        ? Math.round(d.latencies.reduce((a, v) => a + v, 0) / d.latencies.length)
        : 0,
      totalCost: Number(d.cost.toFixed(4)),
    }))
  }
}
