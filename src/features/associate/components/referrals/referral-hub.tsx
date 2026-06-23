'use client'

import React, { useEffect, useState } from 'react'
import { getReferralStats, getReferralList, generateQRCodeData } from '@/features/associate/actions/referral-actions'
import { ReferralFunnel } from './referral-funnel'
import { ReferralList } from './referral-list'
import { toast } from 'sonner'
import { Copy, QrCode } from 'lucide-react'

export function ReferralHub() {
  const [stats, setStats] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [qrCodeData, setQrCodeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const statsRes = await getReferralStats()
    const listRes = await getReferralList()
    const qrRes = await generateQRCodeData()

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data)
    }
    if (listRes.success && listRes.data) {
      setReferrals(listRes.data)
    }
    if (qrRes.success && qrRes.data) {
      setQrCodeData(qrRes.data)
    }
    setLoading(false)
  }

  const handleCopyLink = () => {
    if (!qrCodeData?.url) return
    navigator.clipboard.writeText(qrCodeData.url)
    toast.success('Referral link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Referral & Onboarding Hub
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Share your matchmaking code, onboard candidates, and earn commissions.
        </p>
      </div>

      {/* Sharing Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-950 p-8 shadow-sm flex flex-col justify-between h-[230px]">
          <div>
            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">
              Share Your Referral Link
            </h3>
            <p className="text-xs text-gray-400">
              When a user signs up using your code, they are linked to your profile, unlocking milestone commission payout rates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
              {qrCodeData?.url}
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl text-xs font-extrabold shadow transition cursor-pointer"
            >
              <Copy size={14} /> Copy Link
            </button>
          </div>
        </div>

        {/* QR Code Placeholder Box */}
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-[230px]">
          <QrCode className="text-pink-500 w-12 h-12 mb-3" />
          <h4 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
            Referral Code: {qrCodeData?.code}
          </h4>
          <p className="text-[10px] text-gray-400 mt-1 max-w-[150px]">
            Show this code to candidates during offline onboarding events.
          </p>
        </div>
      </div>

      {/* Funnel & Referrals list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
            Referral Conversion Funnel
          </h3>
          <ReferralFunnel stats={stats} />
        </div>

        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-6">
            My Referral List
          </h3>
          <ReferralList referrals={referrals} />
        </div>
      </div>
    </div>
  )
}
