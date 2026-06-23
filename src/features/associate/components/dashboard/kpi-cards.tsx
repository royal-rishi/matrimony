'use client'

import React from 'react'
import {
  Users,
  Briefcase,
  CheckCircle,
  Heart,
  Star,
  Wallet,
  Share2,
  Clock,
} from 'lucide-react'
import type { AssociateDashboardKPIs } from '@/types/database'

export function KpiCards({ kpis }: { kpis: AssociateDashboardKPIs }) {
  const cards = [
    {
      title: 'Assigned Clients',
      value: kpis.assigned_users,
      icon: Users,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-500 border-blue-100 dark:border-blue-900/50',
    },
    {
      title: 'Active Cases',
      value: kpis.active_cases,
      icon: Briefcase,
      color: 'from-amber-500/10 to-orange-500/10 text-amber-500 border-amber-100 dark:border-amber-900/50',
    },
    {
      title: 'Monthly Completions',
      value: kpis.cases_completed_this_month,
      icon: CheckCircle,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-500 border-emerald-100 dark:border-emerald-900/50',
    },
    {
      title: 'Marriage Successes',
      value: kpis.marriage_successes,
      icon: Heart,
      color: 'from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-100 dark:border-rose-900/50',
    },
    {
      title: 'Average Rating',
      value: `${kpis.average_rating} / 5.0`,
      icon: Star,
      color: 'from-purple-500/10 to-violet-500/10 text-purple-500 border-purple-100 dark:border-purple-900/50',
    },
    {
      title: 'Wallet Balance',
      value: `₹${Number(kpis.wallet_balance).toLocaleString('en-IN')}`,
      icon: Wallet,
      color: 'from-emerald-500/10 to-green-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-900/50',
      isHero: true,
    },
    {
      title: 'Referrals (This Month)',
      value: kpis.referrals_this_month,
      icon: Share2,
      color: 'from-cyan-500/10 to-blue-500/10 text-cyan-500 border-cyan-100 dark:border-cyan-900/50',
    },
    {
      title: 'Avg Response Time',
      value: `${kpis.average_response_hours} hrs`,
      icon: Clock,
      color: 'from-slate-500/10 to-zinc-500/10 text-slate-500 border-slate-100 dark:border-slate-900/50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border bg-white dark:bg-gray-950 p-6 shadow-sm transition hover:shadow-md ${
              card.isHero
                ? 'border-pink-500 bg-gradient-to-br from-white to-pink-50/20 dark:from-gray-950 dark:to-pink-950/5'
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {card.title}
                </p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">
                  {card.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            {card.isHero && (
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
                <Icon className="w-24 h-24 text-rose-500" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
