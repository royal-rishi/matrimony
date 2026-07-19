'use client'

// ============================================================
// NOTIFICATION ANALYTICS PANEL
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Period = '7d' | '30d' | '90d'

interface ChannelStats {
  channel: string
  total: number
  delivered: number
  failed: number
  deliveryRate: number
  color: string
}

interface DayStat {
  date: string
  email: number
  sms: number
  whatsapp: number
  total: number
}

export const AnalyticsPanel: React.FC = () => {
  const [period, setPeriod] = useState<Period>('7d')
  const [channelStats, setChannelStats] = useState<ChannelStats[]>([])
  const [dailyStats, setDailyStats] = useState<DayStat[]>([])
  const [loading, setLoading] = useState(true)

  const COLORS: Record<string, string> = {
    email: '#6366f1',
    sms: '#f59e0b',
    whatsapp: '#22c55e',
    in_app: '#3b82f6',
    push: '#8b5cf6',
  }

  useEffect(() => {
    loadAnalytics()
  }, [period])

  async function loadAnalytics() {
    setLoading(true)
    const supabase = createClient()

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const from = new Date()
    from.setDate(from.getDate() - days)
    const fromStr = from.toISOString()

    // Fetch aggregated logs
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('channel, status, created_at, cost_units')
      .gte('created_at', fromStr)
      .order('created_at', { ascending: true })

    if (!logs) {
      setLoading(false)
      return
    }

    // Aggregate by channel
    const channelMap: Record<string, { total: number; delivered: number; failed: number }> = {}
    interface DayRecord { email: number; sms: number; whatsapp: number; total: number }
    const dayMap: Record<string, DayRecord> = {}

    logs.forEach((log: any) => {
      const ch = log.channel || 'unknown'
      if (!channelMap[ch]) channelMap[ch] = { total: 0, delivered: 0, failed: 0 }
      channelMap[ch].total++

      const isDelivered = ['delivered', 'dispatched', 'sent', 'read'].includes(log.status)
      if (isDelivered) channelMap[ch].delivered++
      if (log.status === 'failed') channelMap[ch].failed++

      // Daily aggregation
      const dayKeyRaw = new Date(log.created_at).toISOString().split('T')
      const dayKey: string = dayKeyRaw[0] ?? ''
      if (!dayKey) return
      if (!dayMap[dayKey]) dayMap[dayKey] = { email: 0, sms: 0, whatsapp: 0, total: 0 }
      dayMap[dayKey].total++
      if (ch === 'email') dayMap[dayKey].email++
      if (ch === 'sms') dayMap[dayKey].sms++
      if (ch === 'whatsapp') dayMap[dayKey].whatsapp++
    })

    const stats: ChannelStats[] = Object.entries(channelMap).map(([ch, data]) => ({
      channel: ch,
      total: data.total,
      delivered: data.delivered,
      failed: data.failed,
      deliveryRate: data.total > 0 ? Number(((data.delivered / data.total) * 100).toFixed(1)) : 0,
      color: COLORS[ch] || '#94a3b8',
    }))

    const daily: DayStat[] = Object.entries(dayMap)
      .map(([date, counts]): DayStat => ({ date, email: counts.email, sms: counts.sms, whatsapp: counts.whatsapp, total: counts.total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    setChannelStats(stats)
    setDailyStats(daily)
    setLoading(false)
  }

  const totalSent = channelStats.reduce((acc, s) => acc + s.total, 0)
  const totalDelivered = channelStats.reduce((acc, s) => acc + s.delivered, 0)
  const totalFailed = channelStats.reduce((acc, s) => acc + s.failed, 0)
  const overallRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0'

  // Find max day total for bar chart scaling
  const maxDayTotal = Math.max(...dailyStats.map((d) => d.total), 1)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold animate-pulse">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notification Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">Delivery performance, channel breakdowns, and cost trends.</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden text-xs font-semibold">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                period === p
                  ? 'bg-rose-500 text-white'
                  : 'bg-white dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total Dispatched',
            value: totalSent.toLocaleString(),
            icon: '📤',
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
          },
          {
            label: 'Successfully Delivered',
            value: totalDelivered.toLocaleString(),
            icon: '✅',
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
          },
          {
            label: 'Overall Delivery Rate',
            value: `${overallRate}%`,
            icon: '📈',
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20',
          },
          {
            label: 'Failed Deliveries',
            value: totalFailed.toLocaleString(),
            icon: '❌',
            color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm p-4 flex items-center gap-3"
          >
            <div className={`p-2.5 rounded-xl text-lg ${card.color}`}>{card.icon}</div>
            <div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">{card.label}</span>
              <span className="text-lg font-black text-gray-900 dark:text-white leading-none">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Volume Chart */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Daily Volume Trend</h3>
          {dailyStats.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400">
              No data for this period.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Simple bar chart */}
              <div className="flex items-end gap-1 h-40">
                {dailyStats.slice(-14).map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-sm bg-indigo-500 transition-all duration-300 min-h-[2px]"
                      style={{
                        height: `${Math.max(4, (day.total / maxDayTotal) * 140)}px`,
                        opacity: 0.85,
                      }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[9px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
                      {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}: {day.total}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                <span>
                  {dailyStats.slice(-14).at(0) != null &&
                    new Date(dailyStats.slice(-14).at(0)!.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
                <span>
                  {dailyStats.slice(-1).at(0) != null &&
                    new Date(dailyStats.slice(-1).at(0)!.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Channel Performance Table */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Channel Performance</h3>
          {channelStats.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-400">
              No channel data for this period.
            </div>
          ) : (
            <div className="space-y-4">
              {channelStats.map((stat) => (
                <div key={stat.channel} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="uppercase text-gray-700 dark:text-gray-300">{stat.channel}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-gray-500">{stat.total.toLocaleString()} sent</span>
                      <span
                        className={`font-bold ${
                          stat.deliveryRate >= 95
                            ? 'text-emerald-600'
                            : stat.deliveryRate >= 80
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {stat.deliveryRate}%
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-900 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stat.deliveryRate}%`,
                        backgroundColor: stat.color,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Channel Breakdown Table */}
      {channelStats.length > 0 && (
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Detailed Channel Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500">
                  <th className="py-2 font-bold">Channel</th>
                  <th className="py-2 text-right font-bold">Total Sent</th>
                  <th className="py-2 text-right font-bold">Delivered</th>
                  <th className="py-2 text-right font-bold">Failed</th>
                  <th className="py-2 text-right font-bold">Delivery Rate</th>
                  <th className="py-2 text-right font-bold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                {channelStats.map((stat) => (
                  <tr key={stat.channel} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: stat.color }}
                        ></span>
                        <span className="font-bold uppercase text-gray-900 dark:text-white">{stat.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400 font-medium">
                      {stat.total.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-emerald-600 font-bold">
                      {stat.delivered.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-rose-500 font-bold">
                      {stat.failed.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`font-black ${
                          stat.deliveryRate >= 95
                            ? 'text-emerald-600'
                            : stat.deliveryRate >= 80
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {stat.deliveryRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {stat.deliveryRate >= 95 ? (
                        <TrendingUp size={14} className="text-emerald-500 inline" />
                      ) : stat.deliveryRate >= 80 ? (
                        <Minus size={14} className="text-amber-500 inline" />
                      ) : (
                        <TrendingDown size={14} className="text-rose-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
