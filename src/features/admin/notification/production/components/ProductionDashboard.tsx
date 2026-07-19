'use client'

// ============================================================
// ADMIN PRODUCTION READINESS & DEVSECOPS DASHBOARD — Phase 11
// Contains system audits, interactive stress triggers, chaos toggles,
// GDPR user data scrub tools, and go-live trackers.
// ============================================================

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Flame,
  Zap,
  RotateCcw,
  UserX,
  FileCheck,
  AlertTriangle,
  Play,
  RotateCw,
  CheckCircle,
  Database,
  Search,
} from 'lucide-react'
import {
  runSecurityOWASPAudit,
  runLoadTestSimulation,
  getChaosConfig,
  updateChaosConfig,
  resetChaosEngine,
  triggerDLQReplay,
  triggerGDPRPurge,
  getBackupStatus,
} from '../actions/production.actions'

interface CheckItem {
  id: string
  task: string
  completed: boolean
}

export default function ProductionDashboard() {
  const [loading, setLoading] = useState(false)
  const [securityScore, setSecurityScore] = useState<number | null>(null)
  const [securityChecks, setSecurityChecks] = useState<any[]>([])
  const [loadResult, setLoadResult] = useState<any | null>(null)
  const [chaosConfig, setChaosConfig] = useState<any | null>(null)
  const [backupInfo, setBackupInfo] = useState<any | null>(null)
  const [purgeUserId, setPurgeUserId] = useState('')
  const [purgeResult, setPurgeResult] = useState<string | null>(null)
  const [replayResult, setReplayResult] = useState<string | null>(null)

  // Go-Live checklist tracker state
  const [checklist, setChecklist] = useState<CheckItem[]>([
    { id: 'env', task: 'Validate production Env variables', completed: false },
    { id: 'dlt', task: 'Register SMS DLT headers', completed: false },
    { id: 'dns', task: 'Verify SPF / DKIM DNS configuration', completed: false },
    { id: 'rls', task: 'Enable RLS policies on tables', completed: true },
    { id: 'cron', task: 'Verify pg_cron background jobs scheduler', completed: false },
    { id: 'backup', task: 'Perform initial binary backup restore drill', completed: false },
  ])

  useEffect(() => {
    loadInitialStats()
  }, [])

  async function loadInitialStats() {
    try {
      const cc = await getChaosConfig()
      setChaosConfig(cc)

      const b = await getBackupStatus()
      setBackupInfo(b)

      const sec = await runSecurityOWASPAudit()
      setSecurityScore(sec.score)
      setSecurityChecks(sec.checks)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleCheck = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const handleRunSecurityAudit = async () => {
    setLoading(true)
    try {
      const res = await runSecurityOWASPAudit()
      setSecurityScore(res.score)
      setSecurityChecks(res.checks)
    } finally {
      setLoading(false)
    }
  }

  const handleRunLoadTest = async (concurrency: number, channel: 'sms' | 'email' | 'whatsapp' | 'mixed') => {
    setLoading(true)
    try {
      const res = await runLoadTestSimulation(concurrency, channel)
      setLoadResult(res)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleChaos = async (key: string, val: boolean) => {
    try {
      const updated = await updateChaosConfig({ [key]: val })
      setChaosConfig(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const handleResetChaos = async () => {
    try {
      const res = await resetChaosEngine()
      setChaosConfig(res)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDLQReplay = async (channel?: string) => {
    setLoading(true)
    try {
      const res = await triggerDLQReplay(channel)
      setReplayResult(`Successfully replayed ${res.replayedCount} dead letter items.`)
    } catch (err: any) {
      setReplayResult(`Replay error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGDPRPurge = async () => {
    if (!purgeUserId.trim()) return
    setLoading(true)
    try {
      const res = await triggerGDPRPurge(purgeUserId)
      setPurgeResult(`Purged successfully! Scrubbed ${res.rowsScrubbed} notification records.`)
      setPurgeUserId('')
    } catch (err: any) {
      setPurgeResult(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = checklist.filter((c) => c.completed).length
  const goLiveProgress = Math.round((completedCount / checklist.length) * 100)

  return (
    <div className="space-y-6">
      {/* Top Banner Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider">Security Posture Score</span>
            <span className="text-4xl font-extrabold block mt-1">
              {securityScore !== null ? `${securityScore}%` : 'Evaluating...'}
            </span>
            <span className="text-[10px] text-slate-500 mt-2 block">Based on OWASP Top 10 Checks</span>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <ShieldAlert size={28} className="text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider">Chaos Injectors State</span>
            <span className="text-4xl font-extrabold block mt-1">
              {chaosConfig && Object.values(chaosConfig).some(Boolean) ? 'Active Faults' : 'Idle / Normal'}
            </span>
            <span className="text-[10px] text-slate-500 mt-2 block">Provider offline & delays simulation</span>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-2xl">
            <Flame size={28} className="text-rose-400" />
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block uppercase tracking-wider">Database Backup Status</span>
            <span className="text-4xl font-extrabold block mt-1">
              {backupInfo?.integrityCheck === 'passed' ? 'Valid' : 'Degraded'}
            </span>
            <span className="text-[10px] text-slate-500 mt-2 block">
              Last backup: {backupInfo ? new Date(backupInfo.lastBackupAt).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-2xl">
            <Database size={28} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Control Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security Profile Audit */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck size={16} className="text-rose-500" /> Security Auditing Checklist
            </h2>
            <button
              onClick={handleRunSecurityAudit}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} /> Run Audit
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {securityChecks.map((check, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{check.name}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{check.detail}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${check.status === 'passed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Load Test Performance Console */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap size={16} className="text-rose-500" /> Performance & Load Testing Console
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            <span className="text-xs text-slate-500 block">Trigger concurrent sending simulations:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleRunLoadTest(100, 'sms')}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 text-white font-semibold flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
              >
                <Play size={10} /> 100 Virtual Users
              </button>
              <button
                onClick={() => handleRunLoadTest(1000, 'mixed')}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-900 text-white font-semibold flex items-center gap-1 hover:bg-slate-800 cursor-pointer"
              >
                <Play size={10} /> 1k Users (Mixed)
              </button>
              <button
                onClick={() => handleRunLoadTest(10000, 'mixed')}
                className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 text-white font-semibold flex items-center gap-1 hover:bg-rose-500 cursor-pointer"
              >
                <Play size={10} /> 10k Scale Test
              </button>
            </div>

            {loadResult && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Concurrency Level:</span>
                  <span className="font-bold">{loadResult.concurrency} vUsers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Success / Failed:</span>
                  <span className="font-bold text-emerald-600">{loadResult.successCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">P50 / P95 Latency:</span>
                  <span className="font-bold">{loadResult.p50Ms}ms / {loadResult.p95Ms}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pipeline Throughput:</span>
                  <span className="font-bold text-blue-500">{loadResult.throughputPerSec} msg/sec</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chaos Engineering Injectors */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame size={16} className="text-rose-500" /> Chaos Engineering Controls
            </h2>
            <button
              onClick={handleResetChaos}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={10} /> Reset
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {chaosConfig && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-900">
                  <span className="text-xs text-slate-800 dark:text-slate-200">Disable SMS Gateways</span>
                  <input
                    type="checkbox"
                    checked={chaosConfig.smsProviderDisabled}
                    onChange={(e) => handleToggleChaos('smsProviderDisabled', e.target.checked)}
                    className="h-4 w-4 text-rose-500 rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-900">
                  <span className="text-xs text-slate-800 dark:text-slate-200">Disable Email Gateway</span>
                  <input
                    type="checkbox"
                    checked={chaosConfig.emailProviderDisabled}
                    onChange={(e) => handleToggleChaos('emailProviderDisabled', e.target.checked)}
                    className="h-4 w-4 text-rose-500 rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-900">
                  <span className="text-xs text-slate-800 dark:text-slate-200">Inject DB Slowdown</span>
                  <input
                    type="checkbox"
                    checked={chaosConfig.dbLatencySimulated}
                    onChange={(e) => handleToggleChaos('dbLatencySimulated', e.target.checked)}
                    className="h-4 w-4 text-rose-500 rounded"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-900">
                  <span className="text-xs text-slate-800 dark:text-slate-200">Simulate Worker Crash</span>
                  <input
                    type="checkbox"
                    checked={chaosConfig.workerCrashed}
                    onChange={(e) => handleToggleChaos('workerCrashed', e.target.checked)}
                    className="h-4 w-4 text-rose-500 rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Go-Live Checklists tracker */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle size={16} className="text-rose-500" /> Go-Live Readiness Tracker
            </h2>
          </div>

          <div className="mt-4 space-y-4">
            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${goLiveProgress}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
              {goLiveProgress}% Go-Live Checklist Completed
            </span>

            <div className="space-y-2 mt-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="flex items-center gap-2.5 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    className="h-3.5 w-3.5 text-emerald-500 rounded cursor-pointer"
                  />
                  <span className={`text-xs ${item.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compliance & Recovery Tools */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCw size={16} className="text-rose-500" /> Compliance Tools & DLQ Recovery
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Replay Dead-Letter Queue */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Replay Dead-Lettered Failures
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Triggers replay runs to re-enqueue items currently stuck in the dead letter store.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDLQReplay('sms')}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Replay SMS DLQ
              </button>
              <button
                onClick={() => handleDLQReplay('email')}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
              >
                Replay Email DLQ
              </button>
            </div>
            {replayResult && (
              <span className="text-xs text-blue-500 block mt-2">{replayResult}</span>
            )}
          </div>

          {/* GDPR User Data Purge */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <UserX size={14} className="text-rose-500" /> GDPR User Purge Console
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Anonymizes all delivery logs and purges notification settings matching a User UUID.
            </span>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="User UUID"
                value={purgeUserId}
                onChange={(e) => setPurgeUserId(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded bg-transparent"
              />
              <button
                onClick={handleGDPRPurge}
                className="px-3 py-1.5 text-xs font-bold rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
              >
                Purge User
              </button>
            </div>
            {purgeResult && (
              <span className="text-xs text-rose-500 block mt-2">{purgeResult}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
