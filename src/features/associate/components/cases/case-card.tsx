'use client'
/* eslint-disable @next/next/no-img-element */

import React from 'react'
import Link from 'next/link'
import { Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CaseCard({ c }: { c: any }) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
      case 'normal':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  const clientName = c.client ? `${c.client.first_name} ${c.client.last_name}` : 'Unnamed Client'
  const initial = c.client ? `${c.client.first_name[0]}${c.client.last_name[0]}`.toUpperCase() : 'RJ'

  return (
    <Link
      href={`/associate/cases/${c.id}`}
      className="block p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition duration-200"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
          {c.case_number}
        </span>
        <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', getPriorityBadge(c.case_priority))}>
          {c.case_priority}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {c.client?.avatar_url ? (
          <img
            src={c.client.avatar_url}
            alt={clientName}
            className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-800"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs shadow-inner shrink-0">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
            {clientName}
          </h4>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
            {c.client?.city}, {c.client?.state}
          </p>
        </div>
      </div>

      {c.latest_activity && (
        <div className="mt-3 py-2 px-2.5 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
            {c.latest_activity.description}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
        <div className="flex items-center gap-1 font-semibold">
          <Clock size={12} />
          <span>{c.days_in_current_stage} days in stage</span>
        </div>
        {c.pending_reminders_count > 0 && (
          <div className="flex items-center gap-1 text-red-500 font-bold">
            <AlertCircle size={12} />
            <span>{c.pending_reminders_count} reminders</span>
          </div>
        )}
      </div>
    </Link>
  )
}
