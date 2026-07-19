// ============================================================
// ALERT SERVICE — Phase 10
// Manages alert rules, processes active metrics, evaluates thresholds,
// and persists alert state changes.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { AlertRule, AlertMetric, AlertComparison } from '../types/observability.types'

export class AlertService {
  async getActiveAlerts(): Promise<AlertRule[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_alerts')
      .select('*')
      .eq('is_triggered', true)
      .is('resolved_at', null)
      .order('triggered_at', { ascending: false })

    return (data ?? []).map((row: any) => this.mapRowToRule(row))
  }

  async getAllAlertRules(): Promise<AlertRule[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_alerts')
      .select('*')
      .order('created_at', { ascending: true })

    return (data ?? []).map((row: any) => this.mapRowToRule(row))
  }

  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'isTriggered' | 'triggeredAt' | 'triggeredValue' | 'resolvedAt' | 'resolutionNotes'>): Promise<AlertRule> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notification_alerts')
      .insert({
        name: rule.name,
        description: rule.description,
        metric: rule.metric,
        threshold: rule.threshold,
        comparison: rule.comparison,
        window_minutes: rule.windowMinutes,
        channel_filter: rule.channelFilter,
        provider_filter: rule.providerFilter,
        severity: rule.severity,
        is_active: rule.isActive,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.mapRowToRule(data)
  }

  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    const supabase = await createClient()
    
    const dbPayload: Record<string, any> = {}
    if (updates.name !== undefined) dbPayload.name = updates.name
    if (updates.description !== undefined) dbPayload.description = updates.description
    if (updates.metric !== undefined) dbPayload.metric = updates.metric
    if (updates.threshold !== undefined) dbPayload.threshold = updates.threshold
    if (updates.comparison !== undefined) dbPayload.comparison = updates.comparison
    if (updates.windowMinutes !== undefined) dbPayload.window_minutes = updates.windowMinutes
    if (updates.channelFilter !== undefined) dbPayload.channel_filter = updates.channelFilter
    if (updates.providerFilter !== undefined) dbPayload.provider_filter = updates.providerFilter
    if (updates.severity !== undefined) dbPayload.severity = updates.severity
    if (updates.isActive !== undefined) dbPayload.is_active = updates.isActive

    const { data, error } = await supabase
      .from('notification_alerts')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return this.mapRowToRule(data)
  }

  async deleteAlertRule(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notification_alerts')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  async resolveAlert(id: string, notes?: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notification_alerts')
      .update({
        is_triggered: false,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes ?? 'Manually resolved via admin dashboard.',
      })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  async getAlertHistory(limit: number = 50): Promise<AlertRule[]> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('notification_alerts')
      .select('*')
      .not('triggered_at', 'is', null)
      .order('triggered_at', { ascending: false })
      .limit(limit)

    return (data ?? []).map((row: any) => this.mapRowToRule(row))
  }

  async evaluateAlerts(): Promise<{ triggered: AlertRule[]; resolved: AlertRule[] }> {
    const supabase = await createClient()
    const rules = await this.getAllAlertRules()

    const triggered: AlertRule[] = []
    const resolved: AlertRule[] = []

    for (const rule of rules) {
      if (!rule.isActive) continue

      const liveValue = await this.getLiveMetricValue(rule.metric, rule.windowMinutes, rule.channelFilter, rule.providerFilter)
      const isThresholdExceeded = this.compare(liveValue, rule.threshold, rule.comparison)

      if (isThresholdExceeded && !rule.isTriggered) {
        const { data } = await supabase
          .from('notification_alerts')
          .update({
            is_triggered: true,
            triggered_at: new Date().toISOString(),
            triggered_value: liveValue,
            resolved_at: null,
          })
          .eq('id', rule.id)
          .select()
          .single()

        if (data) triggered.push(this.mapRowToRule(data))
      } else if (!isThresholdExceeded && rule.isTriggered) {
        const { data } = await supabase
          .from('notification_alerts')
          .update({
            is_triggered: false,
            resolved_at: new Date().toISOString(),
            resolution_notes: `Auto-resolved. Metric returned to normal value: ${liveValue}`,
          })
          .eq('id', rule.id)
          .select()
          .single()

        if (data) resolved.push(this.mapRowToRule(data))
      }
    }

    return { triggered, resolved }
  }

  private async getLiveMetricValue(metric: AlertMetric, windowMin: number, channel: string | null, provider: string | null): Promise<number> {
    const supabase = await createClient()
    const now = Date.now()
    const cutoff = new Date(now - windowMin * 60000).toISOString()

    switch (metric) {
      case 'failure_rate': {
        let q = supabase.from('notification_logs').select('status').gte('created_at', cutoff)
        if (channel) q = q.eq('channel', channel)
        if (provider) q = q.eq('provider', provider)
        const { data } = await q
        if (!data || data.length === 0) return 0
        const fails = data.filter((l: any) => ['failed', 'bounced'].includes(l.status)).length
        return (fails / data.length) * 100
      }
      case 'queue_size': {
        let q = supabase.from('notification_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        if (channel) q = q.eq('channel', channel)
        const { count } = await q
        return count ?? 0
      }
      case 'dlq_size': {
        let q = supabase.from('failed_notifications').select('id', { count: 'exact', head: true }).eq('is_resolved', false)
        if (channel) q = q.eq('channel', channel)
        if (provider) q = q.eq('provider', provider)
        const { count } = await q
        return count ?? 0
      }
      case 'dlq_growth': {
        let q = supabase.from('failed_notifications').select('id', { count: 'exact', head: true }).gte('created_at', cutoff)
        if (channel) q = q.eq('channel', channel)
        const { count } = await q
        return count ?? 0
      }
      case 'high_cost': {
        const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
        const { data } = await supabase.from('notification_logs').select('cost_units').gte('created_at', todayStart)
        return (data ?? []).reduce((sum: number, r: any) => sum + Number(r.cost_units ?? 0), 0)
      }
      case 'slow_delivery': {
        let q = supabase.from('notification_logs').select('created_at, delivered_at').gte('created_at', cutoff).not('delivered_at', 'is', null)
        if (channel) q = q.eq('channel', channel)
        const { data } = await q
        if (!data || data.length === 0) return 0
        const diffs = data.map((d: any) => new Date(d.delivered_at).getTime() - new Date(d.created_at).getTime()).filter((ms: number) => ms > 0)
        if (diffs.length === 0) return 0
        return diffs.reduce((a: number, b: number) => a + b, 0) / diffs.length
      }
      case 'retry_explosion': {
        let q = supabase.from('retry_queue').select('id', { count: 'exact', head: true }).gte('created_at', cutoff)
        const { count } = await q
        return count ?? 0
      }
      default:
        return 0
    }
  }

  private compare(val: number, threshold: number, comparison: AlertComparison): boolean {
    switch (comparison) {
      case 'gt': return val > threshold
      case 'lt': return val < threshold
      case 'gte': return val >= threshold
      case 'lte': return val <= threshold
      default: return false
    }
  }

  private mapRowToRule(row: any): AlertRule {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      metric: row.metric as AlertMetric,
      threshold: Number(row.threshold),
      comparison: row.comparison as AlertComparison,
      windowMinutes: row.window_minutes,
      channelFilter: row.channel_filter,
      providerFilter: row.provider_filter,
      severity: row.severity,
      isActive: row.is_active,
      isTriggered: row.is_triggered,
      triggeredAt: row.triggered_at,
      triggeredValue: row.triggered_value != null ? Number(row.triggered_value) : null,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes,
      createdAt: row.created_at,
    }
  }
}
