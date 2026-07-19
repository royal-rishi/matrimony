'use client'

// ============================================================
// DEAD LETTER QUEUE MONITOR & RETRY CENTER
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { retryNotification, retryAll } from '../actions/admin-notifications.actions'
import { toast } from 'sonner'

export const DLQViewer: React.FC = () => {
  const [failures, setFailures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)

  useEffect(() => {
    loadFailures()
  }, [])

  async function loadFailures() {
    setLoading(true)
    const supabase = createClient()
    
    // Fetch failed notifications from DLQ
    const { data } = await supabase
      .from('failed_notifications')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })

    if (data) setFailures(data)
    setLoading(false)
  }

  const handleRetrySingle = async (id: string) => {
    setRetrying(id)
    const res = await retryNotification(id)
    if (res.success) {
      toast.success('Message retried successfully.')
      loadFailures()
    } else {
      toast.error(res.error || 'Retry failed.')
    }
    setRetrying(null)
  }

  const handleRetryAll = async () => {
    setRetrying('all')
    const res = await retryAll()
    if (res.success) {
      toast.success(`Retry sweep complete. Successfully resolved: ${res.successCount} of ${res.retriedCount} items.`)
      loadFailures()
    } else {
      toast.error(res.error || 'Bulk retry failed.')
    }
    setRetrying(null)
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Dead Letter Queue & Retry Center</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review delivery failure logs and manually trigger backup retries.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadFailures}
            className="px-3 py-1.5 bg-gray-50 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white"
          >
            Refresh
          </button>
          {failures.length > 0 && (
            <button
              type="button"
              disabled={retrying !== null}
              onClick={handleRetryAll}
              className="px-4 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-rose-600 disabled:opacity-50"
            >
              {retrying === 'all' ? 'Retrying All...' : 'Retry All Failures'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-xs py-10 text-gray-400">Loading failure logs...</div>
      ) : failures.length === 0 ? (
        <div className="text-center text-xs py-10 text-gray-400">No unresolved failures in the Dead Letter Queue.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Event</th>
                <th className="py-2">Failure Reason</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {failures.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="py-3 text-gray-500 dark:text-gray-400">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400 uppercase font-semibold">{item.channel}</td>
                  <td className="py-3 font-mono text-[10px] text-gray-700 dark:text-gray-300">{item.event}</td>
                  <td className="py-3 text-rose-600 max-w-xs truncate">{item.failure_reason || 'Unknown gateway error.'}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      disabled={retrying !== null}
                      onClick={() => handleRetrySingle(item.id)}
                      className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[10px] font-semibold cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
                    >
                      {retrying === item.id ? 'Retrying...' : 'Retry'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
