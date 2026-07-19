'use client'

// ============================================================
// ALERT CENTER — Phase 10
// Monitors active threshold violations, lists alert routing profiles,
// and facilitates manual event resolution overrides.
// ============================================================

import React, { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Plus,
  Trash2,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AlertRule } from '../types/observability.types'

export default function AlertCenter() {
  const [alerts, setAlerts] = useState<AlertRule[]>([])
  const [history, setHistory] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<AlertRule | null>(null)
  const [evaluating, setEvaluating] = useState(false)

  useEffect(() => {
    loadAlertData()
  }, [])

  async function loadAlertData() {
    setLoading(true)
    try {
      const resRules = await fetch('/api/admin/notification/alerts?type=rules')
      const rulesJson = await resRules.json()
      if (rulesJson.success) setAlerts(rulesJson.data)

      const resHist = await fetch('/api/admin/notification/alerts?type=history')
      const histJson = await resHist.json()
      if (histJson.success) setHistory(histJson.data)
    } catch (err) {
      toast.error('Failed to load alert rules.')
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    setEvaluating(true)
    try {
      const res = await fetch('/api/admin/notification/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate' }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Alert rules evaluated. Triggered: ${json.data.triggered.length}, Resolved: ${json.data.resolved.length}`)
        await loadAlertData()
      } else {
        toast.error('Evaluation failed.')
      }
    } catch (err) {
      toast.error('Network error during evaluation.')
    } finally {
      setEvaluating(false)
    }
  }

  const openResolveModal = (alert: AlertRule) => {
    setSelectedAlert(alert)
    setResolutionNotes('')
    setShowResolveModal(true)
  }

  const handleResolve = async () => {
    if (!selectedAlert) return
    setResolvingId(selectedAlert.id)
    try {
      const res = await fetch('/api/admin/notification/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAlert.id,
          action: 'resolve',
          notes: resolutionNotes,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Alert resolved successfully.')
        setShowResolveModal(false)
        await loadAlertData()
      } else {
        toast.error('Failed to resolve alert.')
      }
    } catch (err) {
      toast.error('Network error resolving alert.')
    } finally {
      setResolvingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold animate-pulse">Loading alert console...</p>
      </div>
    )
  }

  const activeAlerts = alerts.filter((a) => a.isTriggered)

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Upper action bar */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-950 p-4 border border-gray-100 dark:border-gray-900 rounded-2xl shadow-sm">
        <div>
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Alert Engine Management</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Evaluate rules manually or inspect triggered alerts.</p>
        </div>
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={evaluating}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
        >
          <Play size={12} className={evaluating ? 'animate-spin' : ''} />
          {evaluating ? 'Evaluating...' : 'Evaluate Rules Now'}
        </button>
      </div>

      {/* Triggered Banners */}
      {activeAlerts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">Active Incidents</h4>
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-xl flex items-center justify-between shadow-sm animate-pulse ${
                alert.severity === 'critical'
                  ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50'
                  : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{alert.name}</span>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">{alert.description}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-gray-400 uppercase">
                    <span>Severity: {alert.severity}</span>
                    <span>•</span>
                    <span>Value: {alert.triggeredValue}</span>
                    <span>•</span>
                    <span>Triggered At: {new Date(alert.triggeredAt!).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openResolveModal(alert)}
                className="px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 font-bold rounded-lg cursor-pointer transition"
              >
                Acknowledge & Resolve
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-emerald-50/40 border border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/40 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          <div>
            <span className="font-bold text-emerald-800 dark:text-emerald-400">All Metrics Within Thresholds</span>
            <p className="text-emerald-700/80 dark:text-emerald-450/70 mt-0.5">No active alerts triggered at this time.</p>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 p-5 shadow-sm">
        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-250 mb-4">Configured Alert Rules</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500 font-bold">
                <th className="py-2">Rule Name</th>
                <th className="py-2">Metric</th>
                <th className="py-2">Threshold</th>
                <th className="py-2">Window</th>
                <th className="py-2">Severity</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {alerts.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="py-3 font-semibold text-gray-950 dark:text-white">{rule.name}</td>
                  <td className="py-3 font-mono text-gray-600 dark:text-gray-400">{rule.metric}</td>
                  <td className="py-3 uppercase font-bold text-gray-700 dark:text-gray-300">
                    {rule.comparison} {rule.threshold}
                  </td>
                  <td className="py-3 text-gray-500">{rule.windowMinutes}m</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        rule.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                          : rule.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td className="py-3">
                    {rule.isTriggered ? (
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> Triggered
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Incidents */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 p-5 shadow-sm">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-250 mb-4">Alert History Log</h4>
          <div className="space-y-3">
            {history.map((hist) => (
              <div key={hist.id} className="p-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-900 flex items-start justify-between">
                <div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{hist.name}</span>
                  <p className="text-gray-400 mt-0.5">{hist.description}</p>
                  {hist.resolutionNotes && (
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      ✓ Resolution: {hist.resolutionNotes}
                    </p>
                  )}
                </div>
                <div className="text-right text-[10px] text-gray-400 font-medium">
                  <div>Triggered: {new Date(hist.triggeredAt!).toLocaleDateString()}</div>
                  {hist.resolvedAt && <div>Resolved: {new Date(hist.resolvedAt).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {showResolveModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Incident Intervention</span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">Resolve Alert: {selectedAlert.name}</h3>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Resolution Actions Taken</label>
              <textarea
                placeholder="Enter actions taken to investigate and resolve this threshold violation..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full h-24 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-rose-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-900">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 font-bold rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolvingId !== null}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl cursor-pointer transition disabled:opacity-50"
              >
                {resolvingId ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
