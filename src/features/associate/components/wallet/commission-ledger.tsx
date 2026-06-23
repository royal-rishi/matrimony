'use client'

import React, { useEffect, useState } from 'react'
import { getCommissionLedger } from '@/features/associate/actions/wallet-actions'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export function CommissionLedger() {
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLedger()
  }, [])

  const fetchLedger = async () => {
    setLoading(true)
    const res = await getCommissionLedger()
    if (res.success && res.data) {
      setLedger(res.data)
    }
    setLoading(false)
  }

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
      case 'premium_subscription':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'
      case 'personal_matchmaking':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-950/20'
      case 'marriage_success':
        return 'bg-pink-50 text-pink-600 dark:bg-pink-950/20'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (ledger.length === 0) {
    return <p className="text-xs text-gray-500 text-center py-6">No commission events recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="pb-3">Type / Event</th>
            <th className="pb-3">Description</th>
            <th className="pb-3">Date</th>
            <th className="pb-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-900 text-xs">
          {ledger.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${entry.is_credit ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25' : 'text-red-500 bg-red-50 dark:bg-red-950/25'}`}>
                    {entry.is_credit ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${getEventBadge(entry.event_type)}`}>
                    {entry.event_type.replace('_', ' ')}
                  </span>
                </div>
              </td>
              <td className="py-4 text-gray-700 dark:text-gray-300 font-medium">
                {entry.description}
              </td>
              <td className="py-4 text-gray-500 dark:text-gray-400 font-medium" suppressHydrationWarning>
                {new Date(entry.created_at).toLocaleDateString()}
              </td>
              <td className={`py-4 text-right font-black ${entry.is_credit ? 'text-emerald-600' : 'text-red-500'}`}>
                {entry.is_credit ? '+' : '-'} ₹{Number(entry.amount).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
