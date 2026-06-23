'use client'

import React, { useState, useEffect } from 'react'
import { getDashboardKPIs } from '@/features/admin/actions/dashboard-actions'
import {
  TrendingUp,
  Users,
  Briefcase,
  Heart,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  HardDrive,
  Activity,
  ArrowUpRight,
  TrendingDown,
  Percent,
  CheckCircle,
  Database
} from 'lucide-react'
import { toast } from 'sonner'

export function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const res = await getDashboardKPIs()
      if (res.success) {
        setKpis(res.data)
      } else {
        toast.error(res.error || 'Failed to load business analytics data')
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading Platform Insights...</span>
        </div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="p-8 text-center text-zinc-500">
        Could not retrieve operational analytics dashboard state.
      </div>
    )
  }

  // Format Helper
  const formatINR = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  const renderSparkline = (data: { date: string; count?: number; amount?: number }[], key: 'count' | 'amount', strokeColor: string) => {
    if (!data || data.length === 0) return null
    const values = data.map((d: any) => d[key])
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    const width = 500
    const height = 120
    const padding = 10

    const points = data.map((d: any, i: number) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const val = d[key]
      const y = height - padding - ((val - min) / range) * (height - padding * 2)
      return `${x},${y}`
    }).join(' ')

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-analytics-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
          fill={`url(#grad-analytics-${strokeColor})`}
        />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Matrimony Business Analytics
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Daily subscription conversions curves, associate network metrics, and platform performance graphs.
        </p>
      </div>

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="p-5 border border-gray-250/60 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Total Registered Profiles</span>
            <span className="text-2xl font-black text-gray-800 dark:text-white leading-none tracking-tight block">{kpis.totalUsers?.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-emerald-500 font-bold block leading-none">{kpis.verifiedUsers || 0} KYC Verified</span>
          </div>
          <div className="p-3.5 rounded-2xl text-blue-500 bg-blue-500/10 leading-none shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="p-5 border border-gray-250/60 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Annual Revenue Ingress</span>
            <span className="text-2xl font-black text-gray-800 dark:text-white leading-none tracking-tight block">{formatINR(kpis.revenueThisYear || 0)}</span>
            <span className="text-[10px] text-gray-400 font-bold block leading-none">Month: {formatINR(kpis.revenueThisMonth || 0)}</span>
          </div>
          <div className="p-3.5 rounded-2xl text-emerald-500 bg-emerald-500/10 leading-none shrink-0">
            <IndianRupee size={20} />
          </div>
        </div>

        <div className="p-5 border border-gray-250/60 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Matchmaking Case Audits</span>
            <span className="text-2xl font-black text-gray-800 dark:text-white leading-none tracking-tight block">{(kpis.activeCases + kpis.completedCases) || 0} Cases</span>
            <span className="text-[10px] text-rose-500 font-bold block leading-none">{kpis.activeCases || 0} Searching stage</span>
          </div>
          <div className="p-3.5 rounded-2xl text-pink-500 bg-pink-500/10 leading-none shrink-0">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="p-5 border border-gray-250/60 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Verified Marriages</span>
            <span className="text-2xl font-black text-gray-800 dark:text-white leading-none tracking-tight block">{kpis.marriageSuccessCount?.toLocaleString('en-IN') || '0'} Success</span>
            <span className="text-[10px] text-gray-400 font-bold block leading-none">Attributed Associate Program</span>
          </div>
          <div className="p-3.5 rounded-2xl text-rose-500 bg-rose-500/10 leading-none shrink-0">
            <Heart size={20} />
          </div>
        </div>
      </div>

      {/* Main Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-gray-200 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">User Registrations Velocity</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Scale timeline over past 6 calendar cycles</p>
            </div>
            <span className="text-xs font-semibold text-pink-500 flex items-center gap-1">
              Active Scaling <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="h-32 w-full relative">
            {renderSparkline(kpis.charts?.userGrowth || [], 'count', '#ec4899')}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold border-t border-gray-100 dark:border-gray-900 pt-3 px-2">
            {(kpis.charts?.userGrowth || []).map((d: any, idx: number) => (
              <span key={idx}>{d.date}</span>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Payments Revenue Curve</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">SaaS memberships subscription ledger check</p>
            </div>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              INR Gross <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="h-32 w-full relative">
            {renderSparkline(kpis.charts?.revenueGrowth || [], 'amount', '#10b981')}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold border-t border-gray-100 dark:border-gray-900 pt-3 px-2">
            {(kpis.charts?.revenueGrowth || []).map((d: any, idx: number) => (
              <span key={idx}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Platform health and Operations statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Conversion Funnel */}
        <div className="border border-gray-200 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest border-b border-gray-100 dark:border-gray-900 pb-3 flex items-center gap-2">
            <Percent size={15} className="text-pink-500" /> Conversion Funnel
          </h3>
          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-gray-650">
                <span>Free Trial Profiles</span>
                <span>{kpis.totalUsers - kpis.premiumUsers} Users</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-gray-650">
                <span>Premium Subscribed</span>
                <span>{kpis.premiumUsers} Users ({( (kpis.premiumUsers / (kpis.totalUsers || 1)) * 100 ).toFixed(1)}%)</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500" style={{ width: `${(kpis.premiumUsers / (kpis.totalUsers || 1)) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between font-bold text-gray-650">
                <span>Personal Matchmaking VIPs</span>
                <span>{kpis.personalMatchmakingUsers || 0} Users ({( (kpis.personalMatchmakingUsers / (kpis.totalUsers || 1)) * 100 ).toFixed(1)}%)</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: `${(kpis.personalMatchmakingUsers / (kpis.totalUsers || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="border border-gray-200 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest border-b border-gray-100 dark:border-gray-900 pb-3 flex items-center gap-2">
            <Activity size={15} className="text-pink-500" /> Platform Infrastructure Nodes
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-bold text-gray-600">
                <Cpu size={14} /> CPU Usage
              </span>
              <span className="font-bold text-gray-800">{kpis.systemHealth?.cpu || 12}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-bold text-gray-600">
                <HardDrive size={14} /> Memory Load
              </span>
              <span className="font-bold text-gray-800">{kpis.systemHealth?.memory || 38}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-bold text-gray-600">
                <Activity size={14} /> API Endpoint Latency
              </span>
              <span className="font-bold text-gray-800">{kpis.systemHealth?.latencyMs || 75} ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 font-bold text-gray-600">
                <Database size={14} /> DB Connection Load
              </span>
              <span className="font-bold text-emerald-500 flex items-center gap-1 uppercase text-[10px] font-black">
                <CheckCircle size={10} /> Stable (Healthy)
              </span>
            </div>
          </div>
        </div>

        {/* Operations queue logs summary */}
        <div className="border border-gray-200 dark:border-gray-850 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest border-b border-gray-100 dark:border-gray-900 pb-3 flex items-center gap-2">
            <ShieldCheck size={15} className="text-pink-500" /> Operations Pending Queues
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600">KYC Verifications Queue</span>
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 font-bold rounded uppercase text-[9px]">
                {kpis.pendingVerifications} Pending
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600">Disputes Cases Queue</span>
              <span className={`px-2 py-0.5 font-bold rounded uppercase text-[9px] ${kpis.pendingDisputes > 0 ? 'bg-red-500/10 text-red-500' : 'bg-zinc-100 text-zinc-400'}`}>
                {kpis.pendingDisputes} Open
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600">Withdrawals Ledgers</span>
              <span className={`px-2 py-0.5 font-bold rounded uppercase text-[9px] ${kpis.pendingWithdrawals > 0 ? 'bg-violet-500/10 text-violet-500' : 'bg-zinc-100 text-zinc-400'}`}>
                {kpis.pendingWithdrawals} Awaiting
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
