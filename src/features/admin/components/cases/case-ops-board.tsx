'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getAdminCases, assignAssociateToCase, closeCase } from '@/features/admin/actions/case-actions'
import { toast } from 'sonner'
import { Search, ArrowRight, Trash2 } from 'lucide-react'
import type { CaseStage } from '@/types/database'

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

export function CaseOpsBoard() {
  const [cases, setCases] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  // Modal / assign triggers
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)

  // Form inputs
  const [assignForm, setAssignForm] = useState({ associateId: '', reason: '' })
  const [closeReason, setCloseReason] = useState('')

  const loadCases = useCallback(async () => {
    const res = await getAdminCases({
      priority: priorityFilter || undefined,
      search: search || undefined,
    })

    if (res.success && res.data) {
      setCases(res.data)
    } else {
      toast.error(res.error || 'Failed to fetch case list')
    }
  }, [search, priorityFilter])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.associateId.trim()) return

    const res = await assignAssociateToCase({
      caseId: selectedCase.id,
      associateId: assignForm.associateId,
      transferReason: assignForm.reason,
    })

    if (res.success) {
      toast.success('Associate ownership assigned/transferred successfully!')
      setIsAssignOpen(false)
      loadCases()
    } else {
      toast.error(res.error || 'Failed to assign associate')
    }
  }

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!closeReason.trim()) return

    const res = await closeCase(selectedCase.id, closeReason)
    if (res.success) {
      toast.success('Case closed successfully')
      setIsCloseOpen(false)
      loadCases()
    } else {
      toast.error(res.error || 'Failed to close case')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Global Cases CRM Operations
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Visual matchmaking pipeline tracking. Manage and re-assign owners.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases by client or associate name..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Kanban Board columns wrapper */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {COLUMNS.map((col) => {
          const colCases = cases.filter((c) => c.status === col.key)
          return (
            <div
              key={col.key}
              className={`flex-col shrink-0 w-72 bg-gray-50/50 dark:bg-gray-900/10 p-4 border border-gray-150 dark:border-gray-900 rounded-2xl ${col.color} min-h-[500px] flex`}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-gray-700 dark:text-gray-200 text-xs tracking-wide">
                  {col.label}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-[9px] font-bold text-gray-500">
                  {colCases.length}
                </span>
              </div>

              {/* Cards stack */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px] pr-1">
                {colCases.map((c) => {
                  const clientName = `${c.client?.first_name} ${c.client?.last_name}`
                  const associateName = c.associate ? `${c.associate.first_name} ${c.associate.last_name}` : 'Unassigned'
                  return (
                    <div
                      key={c.id}
                      className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 shadow-sm space-y-3 hover:shadow transition"
                    >
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{clientName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            c.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-600'
                              : c.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 space-y-1">
                        <span className="block font-bold">Case ID: {c.case_number}</span>
                        <span className="block font-bold text-pink-500">Owner: {associateName}</span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-900">
                        <button
                          onClick={() => {
                            setSelectedCase(c)
                            setIsAssignOpen(true)
                          }}
                          className="text-[9px] font-bold text-blue-500 flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <ArrowRight size={10} /> Transfer Owner
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCase(c)
                            setIsCloseOpen(true)
                          }}
                          className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <Trash2 size={10} /> Close Case
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Transfer Owner Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Transfer Case: {selectedCase?.case_number}
            </h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">New Associate Profile UUID</label>
                <input
                  type="text"
                  placeholder="Enter associate ID"
                  value={assignForm.associateId}
                  onChange={(e) => setAssignForm({ ...assignForm, associateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Reason for Transfer</label>
                <textarea
                  placeholder="Operational justification"
                  value={assignForm.reason}
                  onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Case Modal */}
      {isCloseOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Close Case: {selectedCase?.case_number}
            </h3>
            <form onSubmit={handleCloseSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Reason for Closure</label>
                <textarea
                  placeholder="e.g. Client matched offline, Client requested closure..."
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloseOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Close Case File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
