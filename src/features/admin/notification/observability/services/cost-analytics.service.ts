// ============================================================
// COST ANALYTICS SERVICE — Phase 10
// Calculates delivery costs per channel, per user, and provides projections.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { CostBreakdown, CostByChannel, CostByProvider, CostTrendPoint } from '../types/observability.types'

export class CostAnalyticsService {
  async getTodayCost(): Promise<CostBreakdown> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]!
    const todayStart = `${today}T00:00:00.000Z`

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('channel, cost_units')
      .gte('created_at', todayStart)

    return this.calculateBreakdown('Today', logs ?? [])
  }

  async getMonthlyCost(month?: string): Promise<CostBreakdown> {
    const supabase = await createClient()
    
    // Default to current month YYYY-MM
    const monthStr = month ?? new Date().toISOString().slice(0, 7)
    const start = `${monthStr}-01T00:00:00.000Z`
    
    const year = Number(monthStr.slice(0, 4))
    const nextMonthVal = Number(monthStr.slice(5, 7)) + 1
    const nextMonthStr = nextMonthVal > 12 ? `${year + 1}-01` : `${year}-${String(nextMonthVal).padStart(2, '0')}`
    const end = `${nextMonthStr}-01T00:00:00.000Z`

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('channel, cost_units')
      .gte('created_at', start)
      .lt('created_at', end)

    return this.calculateBreakdown(monthStr, logs ?? [])
  }

  async getCostByChannel(period: string): Promise<CostByChannel[]> {
    const supabase = await createClient()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('channel, cost_units')
      .gte('created_at', start)

    const map: Record<string, { cost: number; count: number }> = {
      sms: { cost: 0, count: 0 },
      email: { cost: 0, count: 0 },
      whatsapp: { cost: 0, count: 0 },
      in_app: { cost: 0, count: 0 },
      push: { cost: 0, count: 0 },
    }

    let totalCost = 0

    logs?.forEach((l: any) => {
      const ch = l.channel ?? 'unknown'
      if (ch in map) {
        const cost = Number(l.cost_units ?? 0)
        map[ch]!.cost += cost
        map[ch]!.count++
        totalCost += cost
      }
    })

    return Object.entries(map).map(([channel, d]) => ({
      channel,
      cost: Number(d.cost.toFixed(4)),
      messageCount: d.count,
      percentage: totalCost > 0 ? Number(((d.cost / totalCost) * 100).toFixed(2)) : 0,
    }))
  }

  async getCostByProvider(period: string): Promise<CostByProvider[]> {
    const supabase = await createClient()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('provider, cost_units')
      .gte('created_at', start)
      .not('provider', 'is', null)

    const map: Record<string, { cost: number; count: number }> = {}

    logs?.forEach((l: any) => {
      const p = l.provider!
      if (!map[p]) map[p] = { cost: 0, count: 0 }
      const cost = Number(l.cost_units ?? 0)
      map[p]!.cost += cost
      map[p]!.count++
    })

    return Object.entries(map).map(([provider, d]) => ({
      provider,
      cost: Number(d.cost.toFixed(4)),
      messageCount: d.count,
      avgCostPerMsg: d.count > 0 ? Number((d.cost / d.count).toFixed(4)) : 0,
    }))
  }

  async getCostPerUser(period: string): Promise<number> {
    const supabase = await createClient()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('user_id, cost_units')
      .gte('created_at', start)

    if (!logs || logs.length === 0) return 0

    const totalCost = logs.reduce((sum: number, l: any) => sum + Number(l.cost_units ?? 0), 0)
    const uniqueUsers = new Set(logs.map((l: any) => l.user_id).filter(Boolean)).size

    if (uniqueUsers === 0) return 0
    return Number((totalCost / uniqueUsers).toFixed(4))
  }

  async getCostTrend(days: number): Promise<CostTrendPoint[]> {
    const supabase = await createClient()
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data: logs } = await supabase
      .from('notification_logs')
      .select('created_at, cost_units')
      .gte('created_at', start)

    const map: Record<string, number> = {}

    // Initialise empty dates
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]!
      map[dateStr] = 0
    }

    logs?.forEach((l: any) => {
      const dateStr = new Date(l.created_at).toISOString().split('T')[0]!
      if (dateStr in map) {
        map[dateStr] = (map[dateStr] ?? 0) + Number(l.cost_units ?? 0)
      }
    })

    return Object.entries(map).map(([date, cost]) => ({
      date,
      cost: Number(cost.toFixed(4)),
    }))
  }

  private calculateBreakdown(period: string, logs: any[]): CostBreakdown {
    let totalCost = 0
    let emailCost = 0
    let smsCost = 0
    let whatsappCost = 0
    let inAppCost = 0

    logs.forEach((l) => {
      const cost = Number(l.cost_units ?? 0)
      totalCost += cost

      if (l.channel === 'email') emailCost += cost
      else if (l.channel === 'sms') smsCost += cost
      else if (l.channel === 'whatsapp') whatsappCost += cost
      else if (l.channel === 'in_app') inAppCost += cost
    })

    const avgCost = logs.length > 0 ? totalCost / logs.length : 0

    // Projected Monthly Cost extrapolation
    let projectedMonthEnd = totalCost
    if (period === 'Today') {
      projectedMonthEnd = totalCost * 30
    } else if (period !== 'Today' && period.includes('-')) {
      const daysInMonth = new Date(
        Number(period.slice(0, 4)),
        Number(period.slice(5, 7)),
        0
      ).getDate()
      const passedDays = new Date().getDate()
      projectedMonthEnd = passedDays > 0 ? (totalCost / passedDays) * daysInMonth : totalCost
    }

    return {
      period,
      totalCost: Number(totalCost.toFixed(4)),
      emailCost: Number(emailCost.toFixed(4)),
      smsCost: Number(smsCost.toFixed(4)),
      whatsappCost: Number(whatsappCost.toFixed(4)),
      inAppCost: Number(inAppCost.toFixed(4)),
      avgCostPerMessage: Number(avgCost.toFixed(4)),
      avgCostPerUser: 0, // Calculated specifically if users lookup needed
      projectedMonthEnd: Number(projectedMonthEnd.toFixed(4)),
    }
  }
}
