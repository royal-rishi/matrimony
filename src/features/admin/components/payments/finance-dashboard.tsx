'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { searchPayments, approveRefund } from '@/features/admin/actions/payment-actions'
import { toast } from 'sonner'
import { Search, RotateCcw, X } from 'lucide-react'

export function FinanceDashboard() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Refund dialog
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')

  const loadPayments = useCallback(async () => {
    setLoading(true)
    const res = await searchPayments({
      search: search || undefined,
      status: statusFilter || undefined,
    })

    if (res.success && res.data) {
      setPayments(res.data)
    } else {
      toast.error(res.error || 'Failed to fetch payments')
    }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refundReason.trim()) return

    const res = await approveRefund({
      paymentId: selectedPayment.id,
      approved: true,
      reason: refundReason,
    })

    if (res.success) {
      toast.success(res.message || 'Refund successfully processed!')
      setIsRefundOpen(false)
      setRefundReason('')
      loadPayments()
    } else {
      toast.error(res.error || 'Refund failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Payment Transactions Audit
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Razorpay payments records, subscription activations, and refund approvals.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payments by Razorpay Order ID or Payment ID..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Payments Table list */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                <th className="p-4">Client Name</th>
                <th className="p-4">Gateway IDs</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Loading financial statements...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No transactions matching criteria.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const clientName = p.user ? `${p.user.first_name} ${p.user.last_name}` : 'Unknown Client'
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {clientName}
                      </td>
                      <td className="p-4 font-semibold text-gray-600 dark:text-gray-400">
                        <span className="block text-[10px] text-gray-400">Order: {p.razorpay_order_id}</span>
                        <span className="block text-[10px] text-pink-500">Pay: {p.razorpay_payment_id || 'N/A'}</span>
                      </td>
                      <td className="p-4 font-extrabold text-gray-800 dark:text-gray-200">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-gray-500" suppressHydrationWarning>
                        {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          p.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' :
                          p.status === 'refunded' ? 'bg-blue-500/10 text-blue-600' :
                          p.status === 'failed' ? 'bg-red-500/10 text-red-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === 'success' && (
                          <button
                            onClick={() => {
                              setSelectedPayment(p)
                              setIsRefundOpen(true)
                            }}
                            className="px-2.5 py-1.5 border border-rose-200 text-rose-500 hover:bg-rose-50/50 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw size={11} /> Request Refund
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

      {/* Refund confirmation modal */}
      {isRefundOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
                Approve Payment Refund
              </h3>
              <button onClick={() => setIsRefundOpen(false)} className="text-gray-400 hover:text-gray-950 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400">
              Confirming refund for Order #{selectedPayment?.razorpay_order_id.substring(0, 12)} of amount ₹{selectedPayment?.amount}. This will deactivate any linked subscription immediately.
            </p>
            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Reason for Refund</label>
                <textarea
                  placeholder="Operational justification for refund processing..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent h-20"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Confirm Refund Approval
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
