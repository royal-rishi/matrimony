'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getAuditLogs } from '@/features/admin/actions/audit-actions'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    const res = await getAuditLogs({
      search: search || undefined,
      action: actionFilter || undefined,
    })

    if (res.success && res.data) {
      setLogs(res.data)
    } else {
      toast.error(res.error || 'Failed to fetch audit logs')
    }
    setLoading(false)
  }, [search, actionFilter])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          System Staff Audit Trails
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Immutable history of all staff activities, bans, mergers, payments overrides, and configurations edits.
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
            placeholder="Search logs by action category or entity types..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="">All Action Types</option>
          <option value="User Banned">Bans</option>
          <option value="User KYC Approved">KYC Approvals</option>
          <option value="User Profile Edited">Edits</option>
          <option value="Refund Approved">Refunds</option>
          <option value="Commission Manual Adjustment Applied">Wallet Adjustments</option>
        </select>
      </div>

      {/* Audit Logs list */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                <th className="p-4">Staff Member</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4 text-right">Details Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading audit trails...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((l) => {
                  const adminName = l.admin ? `${l.admin.first_name} ${l.admin.last_name}` : 'System Override'
                  return (
                    <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {adminName}
                        <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">ID: {l.admin_id?.substring(0, 8) || 'SYSTEM'}</span>
                      </td>
                      <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                        {l.action}
                      </td>
                      <td className="p-4 text-gray-500 font-medium">
                        <span className="block font-bold text-[10px] text-pink-500 uppercase tracking-wider">{l.entity_type}</span>
                        <span className="block text-[9px] text-gray-400 font-bold mt-0.5">ID: {l.entity_id ? l.entity_id.substring(0, 8) : 'N/A'}</span>
                      </td>
                      <td className="p-4 text-gray-400 font-medium">
                        {new Date(l.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-[9px] text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-gray-850 truncate max-w-[150px] inline-block" title={JSON.stringify(l.new_data || {})}>
                          {JSON.stringify(l.new_data || {})}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
