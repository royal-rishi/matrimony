'use client'

import React, { useEffect, useState } from 'react'
import { KpiCards } from './kpi-cards'
import { PendingReminders } from './pending-reminders'
import { ActivityFeed } from './activity-feed'
import { getDashboardKPIs, getCaseTrend } from '@/features/associate/actions/analytics-actions'
import type { AssociateDashboardKPIs } from '@/types/database'
import { Calendar, LineChart, Activity } from 'lucide-react'

export function DashboardOverview() {
  const [kpis, setKpis] = useState<AssociateDashboardKPIs | null>(null)
  const [trendData, setTrendData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const kpisRes = await getDashboardKPIs()
      const trendRes = await getCaseTrend()

      if (kpisRes.success && kpisRes.data) {
        setKpis(kpisRes.data)
      }
      if (trendRes.success && trendRes.data) {
        setTrendData(trendRes.data)
      }
      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    )
  }

  // Calculate coordinates for inline SVG sparkline chart
  const getSvgPath = (points: any[]) => {
    if (points.length === 0) return ''
    const width = 500
    const height = 150
    const padding = 20
    const maxVal = Math.max(...points.map((p) => p.newCases), 1)

    const coords = points.map((p, index) => {
      const x = padding + (index * (width - padding * 2)) / (points.length - 1)
      const y = height - padding - (p.newCases * (height - padding * 2)) / maxVal
      return { x, y }
    })

    return coords.reduce((acc, curr, index) => {
      return index === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
    }, '')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Matchmaker Workspace
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor your assigned clients, coordinate meetings, and process success bonuses.
        </p>
      </div>

      {/* KPIs Grid */}
      {kpis && <KpiCards kpis={kpis} />}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CRM Charts and Reminders (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trend Chart Card */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LineChart size={20} className="text-pink-500" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  30-Day Case Volume Trend
                </h3>
              </div>
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                Active CRM
              </span>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="w-full h-[180px] bg-slate-50 dark:bg-gray-900/50 rounded-xl relative flex items-center justify-center border border-gray-100 dark:border-gray-900">
              {trendData.length > 0 ? (
                <svg viewBox="0 0 500 150" className="w-full h-full p-2 overflow-visible">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Fill under chart line */}
                  <path
                    d={`${getSvgPath(trendData)} L 480 130 L 20 130 Z`}
                    fill="url(#chartGradient)"
                  />
                  {/* Chart Line */}
                  <path
                    d={getSvgPath(trendData)}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Axis line */}
                  <line x1="20" y1="130" x2="480" y2="130" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                </svg>
              ) : (
                <p className="text-xs text-gray-400">Loading chart analytics...</p>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 mt-3">
              <span>30 Days Ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Today's Reminders */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Calendar size={20} className="text-rose-500" />
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Upcoming CRM Follow-ups
              </h3>
            </div>
            <PendingReminders />
          </div>
        </div>

        {/* Real-time Activity Feed (Right col) */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={20} className="text-violet-500" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Real-time Case Activity
            </h3>
          </div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
