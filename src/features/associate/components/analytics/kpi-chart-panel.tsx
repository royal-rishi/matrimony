'use client'

import React, { useEffect, useState } from 'react'
import { getCaseTrend, getPerformanceComparison } from '@/features/associate/actions/analytics-actions'
import { LineChart, Award } from 'lucide-react'

export function KpiChartPanel() {
  const [trendData, setTrendData] = useState<any[]>([])
  const [perf, setPerf] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const trendRes = await getCaseTrend()
      const perfRes = await getPerformanceComparison()

      if (trendRes.success && trendRes.data) setTrendData(trendRes.data)
      if (perfRes.success && perfRes.data) setPerf(perfRes.data)
      setLoading(false)
    }

    loadData()
  }, [])

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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor your cases timeline activity trends, conversions, and metrics relative to your district average.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <LineChart className="text-rose-500" size={18} />
            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
              30-Day CRM Lead Intake Trend
            </h3>
          </div>

          <div className="w-full h-[200px] bg-slate-50 dark:bg-gray-900/50 rounded-2xl relative flex items-center justify-center border border-gray-100 dark:border-gray-900">
            {trendData.length > 0 ? (
              <svg viewBox="0 0 500 150" className="w-full h-full p-2 overflow-visible">
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${getSvgPath(trendData)} L 480 130 L 20 130 Z`}
                  fill="url(#analyticsGradient)"
                />
                <path
                  d={getSvgPath(trendData)}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1="20" y1="130" x2="480" y2="130" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
              </svg>
            ) : (
              <p className="text-xs text-gray-400">Loading charts...</p>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2 mt-3">
            <span>30 Days Ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Territory Comparison */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Award className="text-violet-500" size={18} />
            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Territory Benchmark Metrics
            </h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Completed Marriages', val: perf?.personal.completions, avg: perf?.territoryAverage.completions, unit: '' },
              { label: 'Average Client Rating', val: perf?.personal.avgRating, avg: perf?.territoryAverage.avgRating, unit: '/ 5.0' },
              { label: 'CRM Average Response', val: perf?.personal.responseTimeHours, avg: perf?.territoryAverage.responseTimeHours, unit: ' hrs' },
            ].map((metric, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span>{metric.label}</span>
                  <span className="font-extrabold">{metric.val}{metric.unit} vs {metric.avg}{metric.unit}</span>
                </div>
                <div className="flex gap-1 h-3 rounded-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <div
                    style={{ width: `${Math.min((metric.val / (metric.val + metric.avg)) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                    title="Your performance"
                  />
                  <div
                    style={{ width: `${Math.min((metric.avg / (metric.val + metric.avg)) * 100, 100)}%` }}
                    className="h-full bg-violet-400 dark:bg-violet-950 rounded-full opacity-60"
                    title="Territory Average"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>Your KPI</span>
                  <span>District Avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
