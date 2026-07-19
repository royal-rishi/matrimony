'use client'

// ============================================================
// QUEUE MONITOR VIEW COMPONENT
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const QueueViewer: React.FC = () => {
  const [queues, setQueues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQueues()
  }, [])

  async function loadQueues() {
    setLoading(true)
    const supabase = createClient()
    
    // Fetch latest pending/scheduled dispatches in notification_queue
    const { data } = await supabase
      .from('notification_queue')
      .select('*')
      .order('scheduled_for', { ascending: true })
      .limit(20)

    if (data) setQueues(data)
    setLoading(false)
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Active Queue Viewer</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending and scheduled communication dispatches.</p>
        </div>
        <button
          type="button"
          onClick={loadQueues}
          className="px-3 py-1.5 bg-gray-50 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white"
        >
          Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="text-center text-xs py-10 text-gray-400">Loading active queue...</div>
      ) : queues.length === 0 ? (
        <div className="text-center text-xs py-10 text-gray-400">No pending scheduled items in the active queue.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500">
                <th className="py-2">Queue ID</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Scheduled For</th>
                <th className="py-2">Attempts</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {queues.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="py-3 font-mono text-[10px] text-gray-700 dark:text-gray-300">{job.id}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400 uppercase font-semibold">{job.channel}</td>
                  <td className="py-3 text-gray-500 dark:text-gray-400">{new Date(job.scheduled_for).toLocaleString()}</td>
                  <td className="py-3 text-gray-750 dark:text-gray-250 font-medium">{job.attempts} / {job.max_attempts}</td>
                  <td className="py-3 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      job.status === 'scheduled'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                        : job.status === 'processing'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {job.status}
                    </span>
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
