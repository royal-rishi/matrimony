'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getFraudAlerts, updateFraudAlertStatus, runFraudIndicatorsScan } from '@/features/admin/actions/fraud-actions'
import { toast } from 'sonner'
import { RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react'

export function FraudAlertFeed() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [statusFilter, setStatusFilter] = useState('open')

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    const res = await getFraudAlerts({
      status: statusFilter || undefined,
    })

    if (res.success && res.data) {
      setAlerts(res.data)
    } else {
      toast.error(res.error || 'Failed to fetch fraud alerts queue')
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    loadAlerts()
  }, [loadAlerts])

  const handleScan = async () => {
    setScanning(true)
    const res = await runFraudIndicatorsScan()
    if (res.success) {
      toast.success(res.message || 'Fraud scan completed successfully!')
      loadAlerts()
    } else {
      toast.error(res.error || 'Fraud indicators scan failed')
    }
    setScanning(false)
  }

  const handleAction = async (alertId: string, status: 'dismissed' | 'confirmed' | 'under_investigation') => {
    const notes = prompt(`Enter resolution notes / remarks:`)
    if (notes === null) return

    const res = await updateFraudAlertStatus(alertId, status, notes)
    if (res.success) {
      toast.success(`Fraud alert status updated to ${status}!`)
      loadAlerts()
    } else {
      toast.error(res.error || 'Failed to update alert status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
            Anti-Fraud Detection & Risk Queue
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
            Risk scores alerts, duplicate profile signatures, and referral ring abuse monitoring.
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Running Scan...' : 'Trigger Heuristics Scan'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <span className="text-xs font-bold text-gray-500">Security Alerts Queue ({alerts.length})</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="open">Open Security Flags</option>
          <option value="under_investigation">Under Verification Audits</option>
          <option value="dismissed">Dismissed Safe Flags</option>
          <option value="confirmed">Confirmed Fraud Bans</option>
        </select>
      </div>

      {/* Alerts Table list */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                <th className="p-4">Flagged Profile</th>
                <th className="p-4">Trigger Type</th>
                <th className="p-4">Risk Score</th>
                <th className="p-4">Reason Details</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading security flags feed...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No fraud alarms in log.
                  </td>
                </tr>
              ) : (
                alerts.map((a) => {
                  const clientName = a.user ? `${a.user.first_name} ${a.user.last_name}` : 'Unknown Profile'
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {clientName}
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{a.user?.city}</span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                        {a.trigger_type}
                      </td>
                      <td className="p-4 font-extrabold">
                        <span className={`px-2 py-1 rounded-lg text-[10px] ${
                          a.risk_score >= 80 ? 'text-red-600 bg-red-500/10' :
                          a.risk_score >= 50 ? 'text-amber-600 bg-amber-500/10' : 'text-blue-600 bg-blue-500/10'
                        }`}>
                          {a.risk_score}% Severity
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-medium max-w-xs truncate" title={a.details?.reason}>
                        {a.details?.reason || 'Heuristic rules violation flagged.'}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        {a.status === 'open' && (
                          <button
                            onClick={() => handleAction(a.id, 'under_investigation')}
                            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-950 transition cursor-pointer"
                            title="Audit Flag"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {(a.status === 'open' || a.status === 'under_investigation') && (
                          <>
                            <button
                              onClick={() => handleAction(a.id, 'dismissed')}
                              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg cursor-pointer"
                              title="Dismiss / Safe"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleAction(a.id, 'confirmed')}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                              title="Confirm / Ban account"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
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
