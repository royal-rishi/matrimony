'use client'

// ============================================================
// AUDIT LOG VIEWER COMPONENT
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [channelFilter, statusFilter])

  async function loadLogs() {
    setLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (channelFilter !== 'all') {
      query = query.eq('channel', channelFilter)
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    if (data) setLogs(data)
    setLoading(false)
  }

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase()
    return (
      log.user_id?.toLowerCase().includes(term) ||
      log.recipient?.toLowerCase().includes(term) ||
      log.event?.toLowerCase().includes(term) ||
      log.error_message?.toLowerCase().includes(term)
    )
  })

  // Export logs to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return

    const headers = ['Timestamp', 'User ID', 'Channel', 'Event', 'Recipient', 'Status', 'Cost', 'Error Message']
    const rows = filteredLogs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.user_id,
      l.channel,
      l.event,
      l.recipient || '',
      l.status,
      l.cost_units || '0',
      l.error_message || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `notification_logs_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">System Outbound Logs</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Audit log of all platform-generated notifications.</p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-rose-600 self-start"
        >
          Export CSV Report
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid gap-3 sm:grid-cols-3 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 text-xs">
        <input
          type="text"
          placeholder="Search by User, Event, Recipient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
        />

        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
        >
          <option value="all">All Channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="in_app">In-App</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
        >
          <option value="all">All Statuses</option>
          <option value="delivered">Delivered / Dispatched</option>
          <option value="failed">Failed</option>
          <option value="read">Read / Opened</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-xs py-10 text-gray-400">Loading audit records...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center text-xs py-10 text-gray-400">No logs match the selected filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Recipient Address</th>
                <th className="py-2">Event Type</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="py-3 text-gray-500 dark:text-gray-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400 uppercase font-semibold">{log.channel}</td>
                  <td className="py-3 text-gray-750 dark:text-gray-250 truncate max-w-[120px]">{log.recipient || 'N/A'}</td>
                  <td className="py-3 font-mono text-[10px] text-gray-750 dark:text-gray-350">{log.event}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      log.status === 'delivered' || log.status === 'dispatched' || log.status === 'sent'
                        ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                        : log.status === 'failed'
                        ? 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium text-gray-700 dark:text-gray-300">${log.cost_units || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
