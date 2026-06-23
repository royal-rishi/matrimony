'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getAdminDisputes, assignDisputeResolver, resolveDispute } from '@/features/admin/actions/dispute-actions'
import { toast } from 'sonner'
import { X } from 'lucide-react'

export function DisputeResolutionPanel() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open')
  const [totalCount, setTotalCount] = useState(0)

  // Resolve dialog
  const [selectedDispute, setSelectedDispute] = useState<any>(null)
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const loadDisputes = useCallback(async () => {
    setLoading(true)
    const res = await getAdminDisputes({
      status: statusFilter || undefined,
    })

    if (res.success && res.data) {
      setDisputes(res.data)
      setTotalCount(res.totalCount)
    } else {
      toast.error(res.error || 'Failed to fetch disputes list')
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    loadDisputes()
  }, [loadDisputes])

  const handleAssign = async (disputeId: string) => {
    const res = await assignDisputeResolver(disputeId)
    if (res.success) {
      toast.success('Dispute ticket assigned to you for investigation')
      loadDisputes()
    } else {
      toast.error(res.error || 'Failed to assign dispute')
    }
  }

  const handleResolveSubmit = async (e: React.FormEvent, statusVal: 'resolved' | 'dismissed') => {
    e.preventDefault()
    if (!resolutionNotes.trim()) return

    const res = await resolveDispute({
      disputeId: selectedDispute.id,
      resolutionNotes,
      status: statusVal,
    })

    if (res.success) {
      toast.success(`Dispute ticket successfully ${statusVal}!`)
      setIsResolveOpen(false)
      setResolutionNotes('')
      loadDisputes()
    } else {
      toast.error(res.error || 'Failed to resolve dispute')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Disputes & Complaints Center
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Handle user complaints against associates, rating review disputes, and system anomalies.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <span className="text-xs font-bold text-gray-500">Active Disputes ({totalCount})</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="open">Open / Unresolved Disputes</option>
          <option value="under_investigation">Under Investigation</option>
          <option value="resolved">Resolved Disputes</option>
          <option value="dismissed">Dismissed Disputes</option>
        </select>
      </div>

      {/* Disputes table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                <th className="p-4">Dispute Title</th>
                <th className="p-4">Case Info</th>
                <th className="p-4">Investigator</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Loading disputes log...
                  </td>
                </tr>
              ) : disputes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No disputes matching status.
                  </td>
                </tr>
              ) : (
                disputes.map((d) => {
                  const clientName = d.case?.client ? `${d.case.client.first_name} ${d.case.client.last_name}` : 'N/A'
                  const assocName = d.case?.associate ? `${d.case.associate.first_name} ${d.case.associate.last_name}` : 'N/A'
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {d.title}
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{d.dispute_type || 'GENERAL'}</span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400">
                        <span className="block font-semibold">Case #{d.case?.case_number || 'N/A'}</span>
                        <span className="block text-[10px] text-gray-400">Client: {clientName} | Assoc: {assocName}</span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {d.resolver ? `${d.resolver.first_name} ${d.resolver.last_name}` : <span className="text-gray-400 italic">Unassigned</span>}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          d.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600' :
                          d.status === 'dismissed' ? 'bg-gray-150 text-gray-500' : 'bg-red-500/10 text-red-600'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {d.status === 'open' && (
                          <button
                            onClick={() => handleAssign(d.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Claim Ticket
                          </button>
                        )}
                        {(d.status === 'open' || d.status === 'under_investigation') && (
                          <button
                            onClick={() => {
                              setSelectedDispute(d)
                              setIsResolveOpen(true)
                            }}
                            className="px-2 py-1 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Resolve / Audit
                          </button>
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

      {/* Resolve / Dismiss Dialog Modal */}
      {isResolveOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
                Resolve Dispute Ticket
              </h3>
              <button onClick={() => setIsResolveOpen(false)} className="text-gray-400 hover:text-gray-950 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              Please enter detailed resolution feedback. This outcome will be logged in the dispute history audit timeline.
            </p>
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Resolution Notes</label>
                <textarea
                  placeholder="Enter audit investigation outcome notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent h-20"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={(e) => handleResolveSubmit(e, 'dismissed')}
                  className="px-3 py-1.5 border border-rose-250 text-rose-500 font-bold rounded-lg cursor-pointer"
                >
                  Dismiss Dispute
                </button>
                <button
                  onClick={(e) => handleResolveSubmit(e, 'resolved')}
                  className="px-3 py-1.5 bg-pink-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
