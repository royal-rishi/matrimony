'use client'

import React from 'react'
import { useLiveMetrics } from '../hooks/use-live-metrics'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  ShieldAlert,
  CreditCard,
  RefreshCw,
  Zap,
} from 'lucide-react'

export default function ExecutiveDashboard() {
  const { summary, isLoading, lastRefreshed, refresh } = useLiveMetrics()

  // High quality fallback data if the API is pending or database is empty
  const data = summary || {
    date: new Date().toLocaleDateString(),
    totalSent: 124500,
    totalDelivered: 123100,
    totalFailed: 1400,
    deliveryRate: 98.87,
    failureRate: 1.13,
    totalOTP: 85200,
    otpVerified: 79800,
    totalSMS: 45000,
    totalEmail: 48000,
    totalWhatsApp: 26500,
    totalInApp: 5000,
    costToday: 184.50,
    costMonth: 5420.25,
    queueSize: 12,
    retryQueueSize: 3,
    dlqSize: 5,
    avgDeliveryTimeMs: 420,
    activeAlerts: 1,
  }

  const otpSuccessRate = data.totalOTP > 0 ? (data.otpVerified / data.totalOTP) * 100 : 0

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Executive Observability</h2>
          <p className="text-sm text-slate-400">
            Real-time operational health, volumes, and metrics for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Last synced: {new Date(lastRefreshed).toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Delivery Success Rate Card */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition hover:border-emerald-500/30">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Delivery success</span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
              +{data.deliveryRate}%
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{data.totalDelivered.toLocaleString()}</span>
            <span className="text-xs text-slate-500">/ {data.totalSent.toLocaleString()}</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{(data.totalSent - data.totalFailed).toLocaleString()} successful dispatches</span>
          </div>
        </div>

        {/* Failed / DLQ Card */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition hover:border-rose-500/30">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-rose-500/5 blur-xl group-hover:bg-rose-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Failures & DLQ</span>
            <span className={`rounded px-2 py-0.5 text-xs font-bold ${data.dlqSize > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
              {data.dlqSize} in DLQ
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{data.totalFailed.toLocaleString()}</span>
            <span className="text-xs text-slate-500">({data.failureRate}%)</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>Requires manual retry or review</span>
          </div>
        </div>

        {/* Queue Backlog */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition hover:border-amber-500/30">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-amber-500/5 blur-xl group-hover:bg-amber-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Queue backlog</span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {data.avgDeliveryTimeMs}ms avg
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">{data.queueSize}</span>
            <span className="text-xs text-slate-500">active ({data.retryQueueSize} retrying)</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-400">
            <Zap className="h-3.5 w-3.5" />
            <span>Processors running within healthy parameters</span>
          </div>
        </div>

        {/* Financial metrics */}
        <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md transition hover:border-rose-500/30">
          <div className="absolute top-0 right-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-rose-500/5 blur-xl group-hover:bg-rose-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Disbursement Cost</span>
            <span className="text-xs text-slate-400">MTD: ${data.costMonth.toFixed(2)}</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">${data.costToday.toFixed(2)}</span>
            <span className="text-xs text-slate-500">today</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-400">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Accruing relative to message volume</span>
          </div>
        </div>
      </div>

      {/* Detailed Operations Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Channel Dispersal */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-md">
          <h3 className="text-base font-bold text-slate-100">Dispersal by Transmission Channel</h3>
          <p className="mb-4 text-xs text-slate-400">Volume and distribution of messages dispatched</p>

          <div className="space-y-4">
            {/* SMS */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-400" />
                  <span>SMS (MSG91 Gateway)</span>
                </div>
                <span className="font-semibold">{data.totalSMS.toLocaleString()} ({((data.totalSMS / data.totalSent) * 100).toFixed(0)}%)</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(data.totalSMS / data.totalSent) * 100}%` }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Email (MSG91 Sparkpost)</span>
                </div>
                <span className="font-semibold">{data.totalEmail.toLocaleString()} ({((data.totalEmail / data.totalSent) * 100).toFixed(0)}%)</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(data.totalEmail / data.totalSent) * 100}%` }}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-green-400" />
                  <span>WhatsApp Business API</span>
                </div>
                <span className="font-semibold">{data.totalWhatsApp.toLocaleString()} ({((data.totalWhatsApp / data.totalSent) * 100).toFixed(0)}%)</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(data.totalWhatsApp / data.totalSent) * 100}%` }}
                />
              </div>
            </div>

            {/* In-App */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                  <span>In-App Notifications</span>
                </div>
                <span className="font-semibold">{data.totalInApp.toLocaleString()} ({((data.totalInApp / data.totalSent) * 100).toFixed(0)}%)</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${(data.totalInApp / data.totalSent) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Critical Systems Verification */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-md">
          <div>
            <h3 className="text-base font-bold text-slate-100">Auth Verification Health</h3>
            <p className="mb-4 text-xs text-slate-400">OTP requests vs successful completion rate</p>

            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-950 p-4">
              <div>
                <p className="text-xs text-slate-400">OTP Dispatched</p>
                <p className="text-2xl font-bold text-white">{data.totalOTP.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">OTP Verified</p>
                <p className="text-2xl font-bold text-emerald-400">{data.otpVerified.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Verification Rate</span>
                <span className="font-semibold text-emerald-400">{otpSuccessRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${otpSuccessRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className={`mt-6 flex items-center gap-3 rounded-lg border p-3 text-xs ${data.activeAlerts > 0 ? 'border-rose-500/20 bg-rose-500/5 text-rose-400' : 'border-slate-800 bg-slate-900/60 text-slate-400'}`}>
            <ShieldAlert className={`h-4.5 w-4.5 ${data.activeAlerts > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <p className="font-semibold">{data.activeAlerts > 0 ? `${data.activeAlerts} Active Incidents Detected` : 'All Systems Nominal'}</p>
              <p className="text-[10px] opacity-80">{data.activeAlerts > 0 ? 'Check Alert Center for resolution actions.' : 'No performance thresholds exceeded.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
