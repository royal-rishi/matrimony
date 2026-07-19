// ============================================================
// MONITORING SERVICE — Phase 10
// Queries notification_queue, retry_queue, failed_notifications,
// and notification_logs for real-time monitoring metrics.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { QueueStats, LiveDeliveryEvent } from '../types/observability.types'

export class MonitoringService {
  async getLiveQueueStats(): Promise<QueueStats[]> {
    const supabase = await createClient()

    const { data: queueItems } = await supabase
      .from('notification_queue')
      .select('channel, status, created_at')
      .in('status', ['pending', 'processing', 'scheduled', 'retrying'])

    const { data: dlqItems } = await supabase
      .from('failed_notifications')
      .select('channel')
      .eq('is_resolved', false)

    const statsMap: Record<string, QueueStats> = {}
    const channels = ['email', 'sms', 'whatsapp', 'in_app', 'push']

    channels.forEach((ch) => {
      statsMap[ch] = {
        channel: ch,
        pending: 0,
        processing: 0,
        scheduled: 0,
        retrying: 0,
        deadLettered: 0,
        oldestPendingMinutes: null,
      }
    })

    const now = Date.now()

    queueItems?.forEach((item: any) => {
      const ch = item.channel
      if (!statsMap[ch]) return
      
      if (item.status === 'pending') {
        statsMap[ch]!.pending++
        const itemTime = new Date(item.created_at).getTime()
        const ageMin = Math.round((now - itemTime) / 60000)
        if (statsMap[ch]!.oldestPendingMinutes === null || ageMin > statsMap[ch]!.oldestPendingMinutes!) {
          statsMap[ch]!.oldestPendingMinutes = ageMin
        }
      } else if (item.status === 'processing') {
        statsMap[ch]!.processing++
      } else if (item.status === 'scheduled') {
        statsMap[ch]!.scheduled++
      } else if (item.status === 'retrying') {
        statsMap[ch]!.retrying++
      }
    })

    dlqItems?.forEach((item: any) => {
      const ch = item.channel
      if (statsMap[ch]) {
        statsMap[ch]!.deadLettered++
      }
    })

    return Object.values(statsMap)
  }

  async getLiveRetryBacklog(): Promise<{ total: number; byChannel: Record<string, number> }> {
    const supabase = await createClient()
    const { data: retries } = await supabase
      .from('retry_queue')
      .select('channel')
      .eq('status', 'scheduled')

    const result = {
      total: retries?.length ?? 0,
      byChannel: { sms: 0, email: 0, whatsapp: 0, push: 0, in_app: 0 } as Record<string, number>,
    }

    retries?.forEach((r: any) => {
      if (r.channel && r.channel in result.byChannel) {
        result.byChannel[r.channel] = (result.byChannel[r.channel] ?? 0) + 1
      }
    })

    return result
  }

  async getLiveFailureRate(windowMinutes: number = 15): Promise<number> {
    const supabase = await createClient()
    const cutoff = new Date(Date.now() - windowMinutes * 60000).toISOString()

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('status')
      .gte('created_at', cutoff)

    if (!logs || logs.length === 0) return 0

    const total = logs.length
    const failed = logs.filter((l: any) => ['failed', 'bounced'].includes(l.status)).length

    return Number(((failed / total) * 100).toFixed(2))
  }

  async getDeadLetterQueueSize(): Promise<number> {
    const supabase = await createClient()
    const { count } = await supabase
      .from('failed_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_resolved', false)
    return count ?? 0
  }

  async getRecentDeliveryEvents(limit: number = 50): Promise<LiveDeliveryEvent[]> {
    const supabase = await createClient()
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('id, event, channel, status, provider, recipient, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    return (logs ?? []).map((log: any) => ({
      id: log.id,
      event: log.event,
      channel: log.channel,
      status: log.status,
      provider: log.provider ?? '',
      recipient: log.recipient ?? '',
      createdAt: log.created_at,
    }))
  }

  async getStuckQueueItems(): Promise<Array<{ id: string; channel: string; age: number; attempts: number }>> {
    const supabase = await createClient()
    const thirtyMinAgo = new Date(Date.now() - 30 * 60000).toISOString()

    const { data: items } = await supabase
      .from('notification_queue')
      .select('id, channel, created_at, attempts')
      .eq('status', 'processing')
      .lt('updated_at', thirtyMinAgo)

    const now = Date.now()
    return (items ?? []).map((item: any) => ({
      id: item.id,
      channel: item.channel,
      attempts: item.attempts,
      age: Math.round((now - new Date(item.created_at).getTime()) / 60000),
    }))
  }
}
