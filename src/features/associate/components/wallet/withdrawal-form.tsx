'use client'

import React, { useState } from 'react'
import { requestWithdrawal } from '@/features/associate/actions/wallet-actions'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

export function WithdrawalForm({
  walletBalance,
  bankAccounts,
  onClose,
  onSuccess,
}: {
  walletBalance: number
  bankAccounts: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedBankId, setSelectedBankId] = useState(
    bankAccounts.find((b) => b.is_primary)?.id || bankAccounts[0]?.id || ''
  )
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBankId) {
      toast.error('Please select a saved bank account')
      return
    }
    const parsedAmount = Number(amount)
    if (isNaN(parsedAmount) || parsedAmount < 100) {
      toast.error('Minimum payout amount is ₹100')
      return
    }
    if (parsedAmount > walletBalance) {
      toast.error(`Insufficient balance. Maximum request: ₹${walletBalance}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await requestWithdrawal({
        bankAccountId: selectedBankId,
        amount: parsedAmount,
        notes: notes || undefined,
      })

      if (res.success) {
        toast.success('Payout request submitted successfully!')
        onSuccess()
        onClose()
      } else {
        toast.error(res.error || 'Failed to submit withdrawal request')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
            Request Wallet Payout
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Submit a withdrawal request to transfer wallet earnings to your bank account.
          </p>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="p-4 border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/10 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="text-amber-500 w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Linked Account Required</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
                You must add and save at least one bank account on the wallet page before you can request a payout.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider cursor-pointer"
              >
                Go Link Account
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Select Account */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Destination Bank Account
              </label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                required
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - **** {acc.account_number.slice(-4)} ({acc.account_holder_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Payout Amount */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Payout Amount (INR)
                </label>
                <span className="text-[10px] font-bold text-gray-400">
                  Max: ₹{walletBalance.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum 100"
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                  min={100}
                  max={walletBalance}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Payout Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add payout reference description..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Request Payout'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
