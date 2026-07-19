'use client'

import React, { useState } from 'react'
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  Wifi,
  Clock,
  Play,
} from 'lucide-react'

interface ProviderInfo {
  provider: string
  displayName: string
  channel: string
  isHealthy: boolean
  responseTimeMs: number | null
  availability: number
  successRate: number
  totalRequests: number
  totalFailed: number
  errorMessage: string | null
  checkedAt: string
}

export default function ProviderDashboard() {
  const [providers, setProviders] = useState<ProviderInfo[]>([
    {
      provider: 'msg91_sms',
      displayName: 'MSG91 SMS Gateway',
      channel: 'SMS',
      isHealthy: true,
      responseTimeMs: 180,
      availability: 99.98,
      successRate: 98.92,
      totalRequests: 45000,
      totalFailed: 486,
      errorMessage: null,
      checkedAt: new Date().toISOString(),
    },
    {
      provider: 'msg91_email',
      displayName: 'MSG91 Sparkpost Email',
      channel: 'Email',
      isHealthy: true,
      responseTimeMs: 340,
      availability: 99.95,
      successRate: 99.68,
      totalRequests: 48000,
      totalFailed: 154,
      errorMessage: null,
      checkedAt: new Date().toISOString(),
    },
    {
      provider: 'msg91_whatsapp',
      displayName: 'MSG91 WhatsApp API',
      channel: 'WhatsApp',
      isHealthy: true,
      responseTimeMs: 410,
      availability: 99.85,
      successRate: 97.45,
      totalRequests: 26500,
      totalFailed: 675,
      errorMessage: null,
      checkedAt: new Date().toISOString(),
    },
    {
      provider: 'firebase_push',
      displayName: 'FCM Push Notifications',
      channel: 'Push',
      isHealthy: false,
      responseTimeMs: null,
      availability: 94.20,
      successRate: 85.50,
      totalRequests: 12000,
      totalFailed: 1740,
      errorMessage: 'Authentication Timeout (401)',
      checkedAt: new Date().toISOString(),
    },
    {
      provider: 'internal_inapp',
      displayName: 'Internal WebSocket Engine',
      channel: 'In-App',
      isHealthy: true,
      responseTimeMs: 12,
      availability: 100.00,
      successRate: 100.00,
      totalRequests: 5000,
      totalFailed: 0,
      errorMessage: null,
      checkedAt: new Date().toISOString(),
    },
  ])

  const [pinging, setPinging] = useState<Record<string, boolean>>({})
  const [globalRefreshing, setGlobalRefreshing] = useState(false)

  const triggerPing = async (id: string) => {
    setPinging((prev) => ({ ...prev, [id]: true }))
    // Simulate ping
    await new Promise((resolve) => setTimeout(resolve, 800))
    setProviders((prev) =>
      prev.map((p) => {
        if (p.provider === id) {
          const lat = p.isHealthy ? Math.round(100 + Math.random() * 200) : null
          return {
            ...p,
            responseTimeMs: lat,
            checkedAt: new Date().toISOString(),
          }
        }
        return p
      })
    )
    setPinging((prev) => ({ ...prev, [id]: false }))
  }

  const refreshAll = async () => {
    setGlobalRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setProviders((prev) =>
      prev.map((p) => ({
        ...p,
        checkedAt: new Date().toISOString(),
      }))
    )
    setGlobalRefreshing(false)
  }

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Gateway & Provider Health</h2>
          <p className="text-sm text-slate-400">
            Real-time status, latency times, and success logs of active messaging endpoints.
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={globalRefreshing}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${globalRefreshing ? 'animate-spin' : ''}`} />
          Test All Gateways
        </button>
      </div>

      {/* Provider Cards grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <div
            key={p.provider}
            className={`rounded-xl border bg-slate-900/40 p-5 shadow-lg relative overflow-hidden transition-all duration-300 ${
              p.isHealthy ? 'border-slate-800 hover:border-emerald-500/20' : 'border-rose-500/30 bg-rose-950/5'
            }`}
          >
            {/* Status indicator pill */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${p.isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${p.isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                {p.isHealthy ? 'ONLINE' : 'DEGRADED'}
              </span>
            </div>

            {/* Header info */}
            <div className="mb-4">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-0.5">
                {p.channel} CHANNEL
              </span>
              <h3 className="text-base font-bold text-white pr-20 truncate">{p.displayName}</h3>
            </div>

            {/* Metrics layout */}
            <div className="grid grid-cols-2 gap-3.5 rounded-lg bg-slate-950/70 p-3.5 border border-slate-900/60 mb-4">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Availability</span>
                <span className="text-sm font-semibold text-white">{p.availability.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Success Rate</span>
                <span className={`text-sm font-semibold ${p.successRate > 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {p.successRate.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Ping latency</span>
                <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {p.responseTimeMs ? `${p.responseTimeMs}ms` : 'Timeout'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase">Volume dispatches</span>
                <span className="text-xs font-semibold text-slate-300">
                  {p.totalRequests.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error notifications */}
            {p.errorMessage && (
              <div className="mb-4 flex items-center gap-2 rounded bg-rose-500/10 p-2 text-[10px] text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">{p.errorMessage}</span>
              </div>
            )}

            {/* Trigger actions */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-[9px] text-slate-500">
                Checked: {new Date(p.checkedAt).toLocaleTimeString()}
              </span>
              <button
                onClick={() => triggerPing(p.provider)}
                disabled={pinging[p.provider]}
                className="flex items-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 px-2.5 py-1 text-[10px] text-slate-300 transition duration-150 disabled:opacity-50"
              >
                <Play className={`h-2.5 w-2.5 ${pinging[p.provider] ? 'animate-spin' : ''}`} />
                {pinging[p.provider] ? 'Pinging...' : 'Ping Test'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Latency statistics over time (SVG) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Gateway Latency Distribution (Last 24 Hours)</h3>
            <p className="text-[11px] text-slate-400">Response time profiling across key transaction relays</p>
          </div>
          <Activity className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
        </div>

        <div className="space-y-4">
          {providers.map((p) => {
            if (!p.responseTimeMs) return null
            const percent = Math.min((p.responseTimeMs / 500) * 100, 100)
            return (
              <div key={p.provider} className="flex items-center gap-4">
                <span className="w-32 text-xs text-slate-400 font-medium truncate">{p.displayName}</span>
                <div className="flex-1 h-3 rounded bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      p.responseTimeMs < 200 ? 'bg-emerald-500' : p.responseTimeMs < 400 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-mono text-slate-300">{p.responseTimeMs}ms</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
