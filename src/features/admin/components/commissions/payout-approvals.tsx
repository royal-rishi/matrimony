'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getWithdrawalRequests, processWithdrawalRequest, applyCommissionAdjustment } from '@/features/admin/actions/commission-actions'
import { toast } from 'sonner'
import { Coins } from 'lucide-react'

export function PayoutApprovals() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [totalCount, setTotalCount] = useState(0)

  // Adjustment form states
  const [isAdjustOpen, setIsAdjustOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ associateId: '', amount: 0, type: 'credit' as 'credit' | 'debit', reason: '' })

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const res = await getWithdrawalRequests({
      status: statusFilter || undefined,
    })

    if (res.success && res.data) {
      setRequests(res.data)
      setTotalCount(res.totalCount)
    } else {
      toast.error(res.error || 'Failed to fetch withdrawal requests')
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleProcess = async (reqId: string, status: 'processed' | 'rejected') => {
    const notes = prompt(`Enter payout processing notes (e.g. Bank transaction reference ID):`)
    if (notes === null) return

    const res = await processWithdrawalRequest(reqId, status, notes)
    if (res.success) {
      toast.success(`Withdrawal request marked as ${status}!`)
      loadRequests()
    } else {
      toast.error(res.error || 'Failed to update withdrawal request')
    }
  }

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustForm.associateId.trim() || adjustForm.amount <= 0) return

    const res = await applyCommissionAdjustment({
      associateId: adjustForm.associateId,
      amount: adjustForm.amount,
      type: adjustForm.type,
      reason: adjustForm.reason,
    })

    if (res.success) {
      toast.success('Manual wallet adjustment applied successfully!')
      setIsAdjustOpen(false)
      setAdjustForm({ associateId: '', amount: 0, type: 'credit', reason: '' })
      loadRequests()
    } else {
      toast.error(res.error || 'Failed to apply adjustment')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
            Commissions & Wallet Payouts
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
            Approve and process associate wallet withdrawal requests, or apply balance adjustments.
          </p>
        </div>
        <button
          onClick={() => setIsAdjustOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md hover:from-pink-600 hover:to-rose-700 transition flex items-center gap-1.5"
        >
          <Coins size={14} /> Manual Adjustment
        </button>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <span className="text-xs font-bold text-gray-500">Withdrawals Queue ({totalCount})</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="pending">Pending Admin Verification</option>
          <option value="processed">Processed / Bank Settled</option>
          <option value="rejected">Rejected Payouts</option>
        </select>
      </div>

      {/* Requests table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                <th className="p-4">Associate</th>
                <th className="p-4">Withdrawal Amount</th>
                <th className="p-4">Bank Details</th>
                <th className="p-4">Status</th>
                <th className="p-4">Requested Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Loading payouts queue...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No withdrawal requests matching status.
                  </td>
                </tr>
              ) : (
                requests.map((r) => {
                  const assocName = r.associate ? `${r.associate.first_name} ${r.associate.last_name}` : 'Unknown Associate'
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {assocName}
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{r.associate?.city}</span>
                      </td>
                      <td className="p-4 font-black text-gray-850 dark:text-gray-100">
                        ₹{Number(r.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-400 font-medium">
                        {r.bank ? (
                          <>
                            <span className="block">{r.bank.bank_name}</span>
                            <span className="block text-[10px] text-gray-400">A/C: {r.bank.account_number} | IFSC: {r.bank.ifsc_code}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">No bank details attached</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          r.status === 'processed' ? 'bg-emerald-500/10 text-emerald-600' :
                          r.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500" suppressHydrationWarning>
                        {new Date(r.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcess(r.id, 'rejected')}
                              className="px-2 py-1.5 border border-rose-200 text-rose-500 rounded-lg text-[10px] font-bold hover:bg-rose-50/30 cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleProcess(r.id, 'processed')}
                              className="px-2 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              Settle Payout
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

      {/* Manual Wallet Adjustment modal */}
      {isAdjustOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Manual Wallet Adjustment
            </h3>
            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Associate UUID</label>
                <input
                  type="text"
                  placeholder="Enter associate ID"
                  value={adjustForm.associateId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, associateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Adjustment Type</label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                  >
                    <option value="credit">Credit Balance (+)</option>
                    <option value="debit">Debit Balance (-)</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Amount (INR)</label>
                  <input
                    type="number"
                    value={adjustForm.amount || ''}
                    onChange={(e) => setAdjustForm({ ...adjustForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Adjustment Reason</label>
                <textarea
                  placeholder="Justification logic..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent h-16"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-pink-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Apply Balance Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
