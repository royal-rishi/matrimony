'use client'

import React, { useEffect, useState } from 'react'
import { getWalletSummary, getWithdrawalHistory, getSavedBankAccounts, saveBankAccount } from '@/features/associate/actions/wallet-actions'
import { WithdrawalForm } from './withdrawal-form'
import { CommissionLedger } from './commission-ledger'
import { toast } from 'sonner'
import { Wallet, Plus, CreditCard } from 'lucide-react'

export function WalletOverview() {
  const [summary, setSummary] = useState<any>(null)
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddBank, setShowAddBank] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)

  // Bank Form States
  const [holderName, setHolderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNum, setAccountNum] = useState('')
  const [ifsc, setIfsc] = useState('')

  useEffect(() => {
    loadWalletData()
  }, [])

  const loadWalletData = async () => {
    setLoading(true)
    const summaryRes = await getWalletSummary()
    const historyRes = await getWithdrawalHistory()
    const accountsRes = await getSavedBankAccounts()

    if (summaryRes.success && summaryRes.data) {
      setSummary(summaryRes.data)
    }
    if (historyRes.success && historyRes.data) {
      setWithdrawals(historyRes.data)
    }
    if (accountsRes.success && accountsRes.data) {
      setBankAccounts(accountsRes.data)
    }
    setLoading(false)
  }

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!holderName || !bankName || !accountNum || !ifsc) return

    const res = await saveBankAccount({
      accountHolderName: holderName,
      bankName,
      accountNumber: accountNum,
      ifscCode: ifsc.toUpperCase(),
    })

    if (res.success) {
      toast.success('Bank account saved successfully!')
      setHolderName('')
      setBankName('')
      setAccountNum('')
      setIfsc('')
      setShowAddBank(false)
      loadWalletData()
    } else {
      toast.error(res.error || 'Failed to save bank account')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
      case 'processed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
      default:
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Wallet & Payouts
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor your commission earnings, link bank accounts, and request payouts.
        </p>
      </div>

      {/* Hero row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Balance Hero Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-rose-500 via-pink-500 to-violet-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-[230px]">
          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 pointer-events-none">
            <Wallet className="w-64 h-64" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 opacity-90" />
              <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                Wallet Balance
              </span>
            </div>
            <h2 className="text-5xl font-black mt-3">
              ₹{Number(summary?.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/20">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-85">Total Commission Earned</p>
              <p className="text-lg font-black mt-0.5">
                ₹{Number(summary?.totalEarned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {summary?.walletBalance >= 100 && (
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-5 py-2.5 bg-white text-rose-600 font-extrabold rounded-xl shadow-md hover:shadow-lg transition duration-200 text-xs tracking-wide cursor-pointer"
              >
                Request Payout
              </button>
            )}
          </div>
        </div>

        {/* Saved Bank Accounts List */}
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[230px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Saved Accounts
              </h3>
              {!showAddBank && (
                <button
                  onClick={() => setShowAddBank(true)}
                  className="text-rose-500 hover:text-rose-600 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add Bank
                </button>
              )}
            </div>

            {showAddBank ? (
              <form onSubmit={handleAddBank} className="space-y-3.5">
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Bank Name (e.g. HDFC)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={accountNum}
                    onChange={(e) => setAccountNum(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    placeholder="IFSC Code"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddBank(false)}
                    className="py-1.5 px-3 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : bankAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                <CreditCard className="text-gray-300 w-8 h-8 mb-2" />
                <p className="text-xs text-gray-500 font-semibold">No bank account linked.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1">
                {bankAccounts.map((acc) => (
                  <div key={acc.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {acc.bank_name}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        A/C: **** {acc.account_number.slice(-4)} | {acc.ifsc_code}
                      </p>
                    </div>
                    {acc.is_primary && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-500 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger history and Payout history splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950 p-6 shadow-sm">
            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
              Commission Ledger history
            </h3>
            <CommissionLedger />
          </div>
        </div>

        {/* Withdrawal payout requests list */}
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm h-fit">
          <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
            Withdrawal Request History
          </h3>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {withdrawals.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No payout requests submitted yet.</p>
            ) : (
              withdrawals.map((req) => (
                <div key={req.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200">
                        ₹{Number(req.amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1" suppressHydrationWarning>
                        Requested: {new Date(req.requested_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  {req.rejection_reason && (
                    <p className="text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded mt-3 font-medium">
                      Rejection: {req.rejection_reason}
                    </p>
                  )}
                  {req.transaction_reference && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
                      TxRef: {req.transaction_reference}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showPayoutModal && (
        <WithdrawalForm
          walletBalance={summary?.walletBalance || 0}
          bankAccounts={bankAccounts}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={loadWalletData}
        />
      )}
    </div>
  )
}
