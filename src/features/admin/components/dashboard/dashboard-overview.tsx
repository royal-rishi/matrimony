'use client'

import React from 'react'
import {
  TrendingUp,
  Users,
  Briefcase,
  Heart,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowUpRight,
} from 'lucide-react'

export function DashboardOverview({ kpis }: { kpis: any }) {
  if (!kpis) return null

  // Helper to format numbers in Indian currency format
  const formatINR = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  // Define metric cards config
  const cards = [
    {
      title: 'Total System Users',
      value: kpis.totalUsers?.toLocaleString('en-IN') || '0',
      sub: `+${kpis.newUsersToday || 0} registered today`,
      icon: Users,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Premium Members',
      value: kpis.premiumUsers?.toLocaleString('en-IN') || '0',
      sub: `${kpis.personalMatchmakingUsers || 0} Elite Personal VIPs`,
      icon: TrendingUp,
      color: 'text-pink-500 bg-pink-500/10',
    },
    {
      title: 'Associates Network',
      value: kpis.totalAssociates?.toLocaleString('en-IN') || '0',
      sub: `${kpis.activeAssociates || 0} verified agents active`,
      icon: Briefcase,
      color: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      title: 'Marriage Successes',
      value: kpis.marriageSuccessCount?.toLocaleString('en-IN') || '0',
      sub: 'Attributed success payouts verified',
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10',
    },
    {
      title: "Today's Revenue",
      value: formatINR(kpis.revenueToday || 0),
      sub: `This Month: ${formatINR(kpis.revenueThisMonth || 0)}`,
      icon: IndianRupee,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'KYC Verification queue',
      value: kpis.pendingVerifications?.toString() || '0',
      sub: 'Pending document checks in queue',
      icon: ShieldCheck,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Disputes Pending',
      value: kpis.pendingDisputes?.toString() || '0',
      sub: 'Associate poor service complaints',
      icon: AlertTriangle,
      color: 'text-red-500 bg-red-500/10',
    },
    {
      title: 'Withdrawals Requests',
      value: kpis.pendingWithdrawals?.toString() || '0',
      sub: 'Pending finance processing audits',
      icon: Flame,
      color: 'text-violet-500 bg-violet-500/10',
    },
  ]

  // Inline Custom SVG Chart rendering helpers
  const renderSparkline = (data: { date: string; count?: number; amount?: number }[], key: 'count' | 'amount', strokeColor: string) => {
    if (!data || data.length === 0) return null
    const values = data.map((d: any) => d[key])
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    const width = 500
    const height = 150
    const padding = 20

    const points = data.map((d: any, i: number) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2)
      const val = d[key]
      const y = height - padding - ((val - min) / range) * (height - padding * 2)
      return `${x},${y}`
    }).join(' ')

    const cleanColor = strokeColor.replace('#', '')

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${cleanColor}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
          <filter id={`shadow-${cleanColor}`} x="-5%" y="-20%" width="110%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor={strokeColor} floodOpacity="0.25" />
          </filter>
        </defs>
        <path
          d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
          fill={`url(#grad-${cleanColor})`}
        />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          filter={`url(#shadow-${cleanColor})`}
        />
      </svg>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, idx) => {
          const Icon = c.icon
          return (
            <div
              key={idx}
              className="p-5 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm flex flex-col justify-between hover:shadow-md hover:shadow-pink-500/5 dark:hover:shadow-pink-900/5 hover:border-pink-500/20 dark:hover:border-pink-500/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                  {c.title}
                </span>
                <div className={`p-2.5 rounded-xl shrink-0 leading-none group-hover:scale-110 transition-transform duration-300 ${c.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-gray-800 dark:text-white leading-none tracking-tight block">
                  {c.value}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block mt-1 leading-none">{c.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Analytics Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User registrations Area chart */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
                User Growth Statistics
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                New Registrations trend over past 6 months
              </p>
            </div>
            <span className="text-xs font-semibold text-pink-500 flex items-center gap-1">
              Active Scaling <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="h-44 w-full relative">
            {renderSparkline(kpis.charts?.userGrowth || [], 'count', '#ec4899')}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold border-t border-gray-100 dark:border-gray-900 pt-3 px-2">
            {(kpis.charts?.userGrowth || []).map((d: any, idx: number) => (
              <span key={idx}>{d.date}</span>
            ))}
          </div>
        </div>

        {/* Revenue Growth Bar/Area chart */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
                Revenue Ingress Curve
              </h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                Processed membership subscription revenue
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
              Revenue INR <ArrowUpRight size={14} />
            </span>
          </div>
          <div className="h-44 w-full relative">
            {renderSparkline(kpis.charts?.revenueGrowth || [], 'amount', '#10b981')}
          </div>
          <div className="flex justify-between mt-3 text-[10px] text-gray-400 font-bold border-t border-gray-100 dark:border-gray-900 pt-3 px-2">
            {(kpis.charts?.revenueGrowth || []).map((d: any, idx: number) => (
              <span key={idx}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
