'use client'

import React, { useState, useEffect } from 'react'
import { CaseCard } from './case-card'
import { getCases } from '@/features/associate/actions/case-actions'
import type { CaseStage } from '@/types/database'
import { Search, SlidersHorizontal } from 'lucide-react'

const COLUMNS: { key: CaseStage; label: string; color: string }[] = [
  { key: 'new', label: 'New Lead', color: 'border-t-4 border-t-blue-500' },
  { key: 'requirement_collection', label: 'Req. Collection', color: 'border-t-4 border-t-indigo-500' },
  { key: 'searching', label: 'Searching Matches', color: 'border-t-4 border-t-cyan-500' },
  { key: 'profiles_shared', label: 'Profiles Shared', color: 'border-t-4 border-t-purple-500' },
  { key: 'interested', label: 'Client Interested', color: 'border-t-4 border-t-pink-500' },
  { key: 'family_discussion', label: 'Family Discussion', color: 'border-t-4 border-t-amber-500' },
  { key: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'border-t-4 border-t-rose-500' },
  { key: 'meeting_completed', label: 'Meeting Completed', color: 'border-t-4 border-t-emerald-500' },
  { key: 'engagement', label: 'Engagement', color: 'border-t-4 border-t-violet-600' },
  { key: 'marriage_completed', label: 'Married', color: 'border-t-4 border-t-green-600' },
]

export function CaseKanban() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const loadCases = React.useCallback(async () => {
    setLoading(true)
    const res = await getCases({
      priority: priorityFilter || undefined,
      search: search || undefined,
    })
    if (res.success && res.data) {
      setCases(res.data)
    }
    setLoading(false)
  }, [search, priorityFilter])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Cases Kanban Board
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and progress matching pipelines visually.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by client name or case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
        </div>
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="text-gray-400 w-4 h-4 shrink-0" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition"
          >
            <option value="">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex overflow-x-auto gap-4 pb-6 pt-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 min-h-[500px]">
        {COLUMNS.map((col) => {
          const colCases = cases.filter((c) => c.status === col.key)

          return (
            <div
              key={col.key}
              className={`w-72 shrink-0 flex flex-col bg-gray-50/70 dark:bg-gray-950/20 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden ${col.color}`}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-200/55 dark:border-gray-800/55">
                <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-500">
                  {colCases.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px] scrollbar-none">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : colCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Empty stage</p>
                  </div>
                ) : (
                  colCases.map((c) => <CaseCard key={c.id} c={c} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
