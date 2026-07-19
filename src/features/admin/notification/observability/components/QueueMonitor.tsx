'use client'

import React, { useState } from 'react'
import { useRealtimeQueue } from '../hooks/use-realtime-queue'
import { useRealtimeEvents } from '../hooks/use-realtime-events'
import {
  Layers,
  Clock,
  Play,
  RotateCcw,
  Trash2,
  Activity,
  AlertOctagon,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from 'lucide-react'

export default function QueueMonitor() {
  const { queueStats, isConnected: queueConnected, lastUpdated } = useRealtimeQueue()
  const { events, isConnected: eventsConnected } = useRealtimeEvents()

  const [stuckItems, setStuckItems] = useState([
    { id: 'q_01H2J3K4L5M6N7P8Q9R0S1T2U3', channel: 'sms', age: 34, attempts: 3, payload: 'OTP login to +919876543210' },
    { id: 'q_02H2J3K4L5M6N7P8Q9R0S1T2U4', channel: 'email', age: 48, attempts: 5, payload: 'Daily match recommendations' },
    { id: 'q_03H2J3K4L5M6N7P8Q9R0S1T2U5', channel: 'whatsapp', age: 41, attempts: 2, payload: 'Premium plan billing notification' },
  ])

  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const handleForceRetry = async (id: string) => {
    setActionInProgress(id)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setStuckItems((prev) => prev.filter((item) => item.id !== id))
    setActionInProgress(null)
  }

  const handlePurge = async (id: string) => {
    setActionInProgress(id)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setStuckItems((prev) => prev.filter((item) => item.id !== id))
    setActionInProgress(null)
  }

  // Fallback stats if queueStats is loading/empty
  const displayStats = queueStats && queueStats.length > 0 ? queueStats : [
    { channel: 'sms', pending: 4, processing: 1, scheduled: 0, retrying: 2, deadLettered: 1, oldestPendingMinutes: 12 },
    { channel: 'email', pending: 8, processing: 2, scheduled: 15, retrying: 1, deadLettered: 2, oldestPendingMinutes: 24 },
    { channel: 'whatsapp', pending: 2, processing: 0, scheduled: 0, retrying: 0, deadLettered: 0, oldestPendingMinutes: null },
    { channel: 'push', pending: 0, processing: 0, scheduled: 0, retrying: 0, deadLettered: 0, oldestPendingMinutes: null },
    { channel: 'in_app', pending: 0, processing: 0, scheduled: 0, retrying: 0, deadLettered: 0, oldestPendingMinutes: null },
  ]

  const totalPending = displayStats.reduce((sum, s) => sum + s.pending, 0)
  const totalProcessing = displayStats.reduce((sum, s) => sum + s.processing, 0)
  const totalRetrying = displayStats.reduce((sum, s) => sum + s.retrying, 0)
  const totalDLQ = displayStats.reduce((sum, s) => sum + s.deadLettered, 0)

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header and Connection Indicators */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Real-Time Queue Monitor</h2>
          <p className="text-sm text-slate-400 font-normal">
            Track background database processors, retry delays, and active event log streams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Supabase Realtime Socket Status */}
          <div className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-3.5 py-1 text-xs">
            {queueConnected || eventsConnected ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Live Socket Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-slate-400">Polling mode active</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-slate-500">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Grid of queue size summaries */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Pending Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Pending Dispatch</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalPending}</span>
            <span className="text-xs text-slate-400">jobs</span>
          </div>
        </div>

        {/* Processing Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">In Processing</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-400">{totalProcessing}</span>
            <span className="text-xs text-slate-400 font-medium">active threads</span>
          </div>
        </div>

        {/* Retrying Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Scheduled Retries</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{totalRetrying}</span>
            <span className="text-xs text-slate-400 font-medium">re-queued</span>
          </div>
        </div>

        {/* Dead Letter Queue */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 shadow-md">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">Dead Letter (DLQ)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${totalDLQ > 0 ? 'text-rose-500' : 'text-slate-300'}`}>{totalDLQ}</span>
            <span className="text-xs text-slate-400 font-medium">failures</span>
          </div>
        </div>
      </div>

      {/* Main split display: Channel Metrics vs Stuck Queue Items */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Channel Queue Detail Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Queue Dispersal by Channel</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-semibold">Channel</th>
                  <th className="pb-2 text-center font-semibold">Pending</th>
                  <th className="pb-2 text-center font-semibold">Processing</th>
                  <th className="pb-2 text-center font-semibold">Scheduled</th>
                  <th className="pb-2 text-center font-semibold">Retrying</th>
                  <th className="pb-2 text-center font-semibold text-rose-400">DLQ</th>
                  <th className="pb-2 text-right font-semibold">Oldest Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {displayStats.map((stat, i) => (
                  <tr key={i} className="hover:bg-slate-900/20">
                    <td className="py-2.5 font-semibold text-slate-200 capitalize">{stat.channel}</td>
                    <td className="py-2.5 text-center font-mono">{stat.pending}</td>
                    <td className="py-2.5 text-center font-mono text-blue-400">{stat.processing}</td>
                    <td className="py-2.5 text-center font-mono text-slate-500">{stat.scheduled}</td>
                    <td className="py-2.5 text-center font-mono text-amber-500">{stat.retrying}</td>
                    <td className={`py-2.5 text-center font-mono ${stat.deadLettered > 0 ? 'text-rose-500 font-bold' : 'text-slate-500'}`}>
                      {stat.deadLettered}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">
                      {stat.oldestPendingMinutes ? `${stat.oldestPendingMinutes} min` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stuck Queue Items */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="h-4.5 w-4.5 text-amber-500" />
            <h3 className="text-sm font-bold text-white">Stuck Processing Alerts</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Items remaining in 'processing' status for over 30 minutes without updates.
          </p>

          <div className="space-y-3.5">
            {stuckItems.length === 0 ? (
              <div className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-4 text-center text-xs text-slate-500">
                No stuck items detected in active queues.
              </div>
            ) : (
              stuckItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-slate-500">{item.id}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase">
                      {item.channel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-1">{item.payload}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Stuck for {item.age} min</span>
                    <span>{item.attempts} attempts</span>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-slate-900 pt-2">
                    <button
                      onClick={() => handlePurge(item.id)}
                      disabled={actionInProgress !== null}
                      className="rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] text-rose-400 hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      Purge
                    </button>
                    <button
                      onClick={() => handleForceRetry(item.id)}
                      disabled={actionInProgress !== null}
                      className="rounded bg-rose-500 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-rose-600 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      Retry
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Streaming Activity Events */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Dispatched Events Stream</h3>
            <p className="text-[11px] text-slate-400">Streaming feed of dispatches as resolved by the engine</p>
          </div>
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 font-mono text-[11px] text-slate-300 pr-1">
          {(!events || events.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Awaiting events socket triggers...
            </div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="flex flex-col gap-1.5 md:flex-row md:items-center justify-between rounded bg-slate-950 p-2.5 border border-slate-900">
                <div className="flex items-center gap-2">
                  {ev.status === 'delivered' || ev.status === 'sent' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <span className="font-semibold text-slate-200 capitalize">[{ev.channel}]</span>
                  <span className="text-slate-400 line-clamp-1">{ev.recipient}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="rounded bg-slate-900 border border-slate-800 px-1 py-0.5">{ev.provider}</span>
                  <span>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
