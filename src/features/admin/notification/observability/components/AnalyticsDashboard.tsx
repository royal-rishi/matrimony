'use client'

import React, { useState } from 'react'
import {
  BarChart2,
  Calendar,
  Filter,
  Mail,
  Phone,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Clock,
  Eye,
  MousePointerClick,
} from 'lucide-react'

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'1d' | '7d' | '30d' | '90d'>('7d')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')

  // Sample data corresponding to different granularities
  const dailyTrends = [
    { date: 'Jul 11', email: 4200, sms: 3800, whatsapp: 2100, otp: 5000, total: 15100 },
    { date: 'Jul 12', email: 4800, sms: 4100, whatsapp: 2400, otp: 5500, total: 16800 },
    { date: 'Jul 13', email: 4500, sms: 3900, whatsapp: 2200, otp: 5200, total: 15800 },
    { date: 'Jul 14', email: 5100, sms: 4500, whatsapp: 2800, otp: 6100, total: 18500 },
    { date: 'Jul 15', email: 6200, sms: 5800, whatsapp: 3400, otp: 7500, total: 22900 },
    { date: 'Jul 16', email: 5800, sms: 5200, whatsapp: 3100, otp: 6800, total: 20900 },
    { date: 'Jul 17', email: 6500, sms: 6100, whatsapp: 3900, otp: 8200, total: 24700 },
  ]

  const hourlyVolume = [
    { hour: '00:00', sent: 1200, failed: 20 },
    { hour: '04:00', sent: 800, failed: 10 },
    { hour: '08:00', sent: 3500, failed: 45 },
    { hour: '12:00', sent: 6200, failed: 80 },
    { hour: '16:00', sent: 5800, failed: 65 },
    { hour: '20:00', sent: 4900, failed: 55 },
  ]

  const categoryBreakdown = [
    { category: 'Authentication (OTP)', count: 44300, percentage: 36, color: 'bg-rose-500' },
    { category: 'Match Recommendations', count: 35200, percentage: 28, color: 'bg-emerald-500' },
    { category: 'Chat Notifications', count: 28100, percentage: 23, color: 'bg-blue-500' },
    { category: 'Subscription Billing', count: 9800, percentage: 8, color: 'bg-amber-500' },
    { category: 'System Operations', count: 6100, percentage: 5, color: 'bg-slate-500' },
  ]

  const whatsappTemplates = [
    { name: 'otp_verification_secure', type: 'Utility', sent: 42100, delivered: 42050, read: 39800, cost: 63.15 },
    { name: 'daily_match_digest_v2', type: 'Marketing', sent: 22500, delivered: 21900, read: 18500, cost: 135.00 },
    { name: 'premium_offer_alert', type: 'Marketing', sent: 8400, delivered: 8100, read: 5200, cost: 50.40 },
    { name: 'chat_missed_message', type: 'Utility', sent: 15300, delivered: 15200, read: 14600, cost: 22.95 },
  ]

  const emailStats = {
    sent: 48000,
    delivered: 47850,
    opened: 22400,
    clicked: 6800,
    bounced: 120,
    spam: 30,
    openRate: 46.8,
    ctr: 14.2,
    deliveryRate: 99.6,
  }

  // Calc SVG Heights/Points for Trends
  const maxTotal = Math.max(...dailyTrends.map((d) => d.total))
  const trendPoints = dailyTrends
    .map((d, i) => `${(i / (dailyTrends.length - 1)) * 300},${100 - (d.total / maxTotal) * 80}`)
    .join(' ')

  return (
    <div className="space-y-6 text-slate-100">
      {/* Filters and Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Advanced Notification Analytics</h2>
          <p className="text-sm text-slate-400">Detailed historical trends, click-through rates, and channel efficacy.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Channel selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Channels</option>
              <option value="sms" className="bg-slate-900">SMS</option>
              <option value="email" className="bg-slate-900">Email</option>
              <option value="whatsapp" className="bg-slate-900">WhatsApp</option>
            </select>
          </div>

          {/* Period selector */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
            {(['1d', '7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 font-semibold uppercase transition duration-150 ${
                  period === p ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily trend line chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Daily Dispatch Volume Trend</h3>
              <p className="text-[11px] text-slate-400">Aggregated notifications across all channels</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              +18.2% vs previous {period}
            </span>
          </div>

          {/* SVG Line Graph */}
          <div className="relative h-44 w-full">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="300" y2="80" stroke="#1e293b" strokeDasharray="3 3" />

              {/* Area path */}
              <path
                d={`M 0,100 L ${trendPoints} L 300,100 Z`}
                fill="url(#trendGradient)"
              />

              {/* Trend path */}
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                points={trendPoints}
              />

              {/* Data points */}
              {dailyTrends.map((d, i) => {
                const x = (i / (dailyTrends.length - 1)) * 300
                const y = 100 - (d.total / maxTotal) * 80
                return (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle cx={x} cy={y} r="3" fill="#f43f5e" />
                    <circle cx={x} cy={y} r="6" fill="#f43f5e" className="opacity-0 group-hover/dot:opacity-30 animate-ping" />
                  </g>
                )
              })}
            </svg>

            {/* X-Axis labels */}
            <div className="mt-3 flex justify-between text-[10px] text-slate-500 px-1">
              {dailyTrends.map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Volume & Failure rate bars */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
          <h3 className="text-sm font-bold text-white mb-1">Hourly Load Profile</h3>
          <p className="text-[11px] text-slate-400 mb-4">Average system throughput & latency logs</p>

          <div className="flex h-36 items-end justify-between gap-2 px-1">
            {hourlyVolume.map((item, index) => {
              const maxSent = Math.max(...hourlyVolume.map((h) => h.sent))
              const percent = (item.sent / maxSent) * 100
              return (
                <div key={index} className="group relative flex flex-col items-center flex-1">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden rounded bg-slate-950 p-1.5 text-[10px] text-slate-200 group-hover:block whitespace-nowrap z-10 border border-slate-800">
                    <span className="font-semibold">{item.sent.toLocaleString()} sent</span>
                    <span className="text-rose-400 block">{item.failed} failed</span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full rounded-t bg-slate-800 group-hover:bg-slate-700 transition duration-150 flex flex-col justify-end" style={{ height: '110px' }}>
                    <div className="bg-rose-500 rounded-t w-full" style={{ height: `${percent}%` }} />
                  </div>
                  <span className="mt-2 text-[9px] text-slate-500">{item.hour}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Channels details & breakdowns */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Email Engagement Analytics */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4.5 w-4.5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Email CTR & Opens</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-900">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Open rate</span>
              <span className="text-xl font-bold text-white flex items-center gap-1.5 mt-1">
                <Eye className="h-4 w-4 text-emerald-400" />
                {emailStats.openRate}%
              </span>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-900">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">CTR</span>
              <span className="text-xl font-bold text-white flex items-center gap-1.5 mt-1">
                <MousePointerClick className="h-4 w-4 text-blue-400" />
                {emailStats.ctr}%
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400">Total Bounces</span>
              <span className="font-semibold text-rose-400">{emailStats.bounced}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
              <span className="text-slate-400">Spam Complaints</span>
              <span className="font-semibold text-amber-500">{emailStats.spam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery Success</span>
              <span className="font-semibold text-emerald-400">{emailStats.deliveryRate}%</span>
            </div>
          </div>
        </div>

        {/* Category breakdown bar charts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
          <h4 className="text-sm font-bold text-white mb-4">Category Volume Share</h4>
          <div className="space-y-3.5">
            {categoryBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{item.category}</span>
                  <span className="text-slate-400">{item.count.toLocaleString()} ({item.percentage}%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full">
                  <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OTP requests and verify */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
              <h4 className="text-sm font-bold text-white">OTP Verification Performance</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time analytics tracking authentications across signup/login workflows.
            </p>

            <div className="space-y-3">
              <div className="rounded-lg bg-slate-950 p-3 flex justify-between items-center">
                <span className="text-xs text-slate-400">Verification Rate</span>
                <span className="text-base font-bold text-emerald-400">93.6%</span>
              </div>
              <div className="rounded-lg bg-slate-950 p-3 flex justify-between items-center">
                <span className="text-xs text-slate-400">Abuse Detection Hits</span>
                <span className="text-base font-bold text-rose-400">0.02%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>Average SMS OTP verification completed in 18 seconds.</span>
          </div>
        </div>
      </div>

      {/* WhatsApp Template Performance */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">WhatsApp Business Template Metrics</h3>
            <p className="text-[11px] text-slate-400">Detailed templates delivery & customer engagement rates</p>
          </div>
          <MessageSquare className="h-5 w-5 text-green-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5 font-semibold">Template Identifier</th>
                <th className="pb-2.5 font-semibold">Type</th>
                <th className="pb-2.5 font-semibold text-right">Dispatched</th>
                <th className="pb-2.5 font-semibold text-right">Delivered</th>
                <th className="pb-2.5 font-semibold text-right">Read Rate</th>
                <th className="pb-2.5 font-semibold text-right">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {whatsappTemplates.map((tpl, i) => {
                const readRate = ((tpl.read / tpl.delivered) * 100).toFixed(1)
                return (
                  <tr key={i} className="hover:bg-slate-900/20 transition">
                    <td className="py-3 font-mono text-[11px] text-slate-200">{tpl.name}</td>
                    <td className="py-3">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                        {tpl.type}
                      </span>
                    </td>
                    <td className="py-3 text-right">{tpl.sent.toLocaleString()}</td>
                    <td className="py-3 text-right">{tpl.delivered.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold text-emerald-400">{readRate}%</td>
                    <td className="py-3 text-right text-rose-400 font-mono">${tpl.cost.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
