'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react'
import { getVerificationQueue, verifyUserKYC } from '@/features/admin/actions/verification-actions'
import { toast } from 'sonner'
import { Check, X, ShieldAlert, Award, FileText } from 'lucide-react'

export function VerificationQueue() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [notes, setNotes] = useState('')

  const loadQueue = async () => {
    setLoading(true)
    const res = await getVerificationQueue()
    if (res.success && res.data) {
      setItems(res.data)
      if (res.data.length > 0) setSelectedItem(res.data[0])
      else setSelectedItem(null)
    } else {
      toast.error(res.error || 'Failed to fetch verification queue')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadQueue()
  }, [])

  const handleVerify = async (status: 'approved' | 'rejected') => {
    if (!selectedItem) return
    const res = await verifyUserKYC({
      userId: selectedItem.user_id,
      status,
      notes: notes || undefined,
    })

    if (res.success) {
      toast.success(status === 'approved' ? 'KYC document approved successfully!' : 'KYC document rejected')
      setNotes('')
      loadQueue()
    } else {
      toast.error(res.error || 'Failed to record verification')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Centralized Verification Center
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Review profile metadata, photos, national ID cards, and education proofs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Pending verification tickets */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-4 shadow-sm h-fit space-y-3">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-150 pb-2 mb-3">
            KYC Tickets Queue ({items.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center text-xs text-gray-400 py-6">Loading verification queue...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">No pending KYC verifications.</p>
            ) : (
              items.map((item) => {
                const clientName = `${item.user?.first_name} ${item.user?.last_name}`
                const active = selectedItem?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex justify-between items-center ${
                      active
                        ? 'border-pink-500 bg-pink-500/5 text-pink-500'
                        : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50/50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-gray-700 dark:text-gray-200">{clientName}</span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        {item.national_id_type || 'ID CARD'} Verification
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase" suppressHydrationWarning>
                      {new Date(item.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Compare & Approve Canvas */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm space-y-8">
          {selectedItem ? (
            <>
              {/* Profile Card Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-900 pb-5">
                <div>
                  <h3 className="text-base font-black text-gray-800 dark:text-white">
                    {selectedItem.user?.first_name} {selectedItem.user?.last_name}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">
                    Location: {selectedItem.user?.city}, {selectedItem.user?.state}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] uppercase tracking-wider font-bold">
                    Pending Audit
                  </span>
                </div>
              </div>

              {/* Grid comparing profile pics & KYC files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                {/* Profile photo verification */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Award size={14} className="text-pink-500" /> Uploaded Profile Photos
                  </h4>
                  {selectedItem.user?.photos && selectedItem.user.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedItem.user.photos.map((pUrl: string, idx: number) => (
                        <img
                          key={idx}
                          src={pUrl}
                          alt="Profile Attachment"
                          className="w-full h-32 object-cover rounded-xl border border-gray-100 shadow-inner"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-32 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                      No photo uploads available.
                    </div>
                  )}
                </div>

                {/* Identity proof files */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <FileText size={14} className="text-pink-500" /> Verification Documents
                  </h4>
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-100 dark:border-gray-900 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 space-y-1">
                      <span className="block font-bold text-gray-400 text-[9px] uppercase">ID Type</span>
                      <span className="block font-semibold text-gray-700 dark:text-gray-300">
                        {selectedItem.national_id_type || 'N/A'} - {selectedItem.national_id_number || 'N/A'}
                      </span>
                    </div>

                    {selectedItem.id_proof_url ? (
                      <a
                        href={selectedItem.id_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                      >
                        View National ID Proof File
                      </a>
                    ) : (
                      <span className="block text-center py-2 border border-dashed border-gray-200 text-gray-400 rounded-xl">
                        No ID Proof document uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Board (verify/notes/rejection) */}
              <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-900 p-5 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                    Verification Audit Notes / Rejection Reason
                  </label>
                  <textarea
                    placeholder="Enter review feedback notes (required if rejecting document checks)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500/30 min-h-[75px]"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => handleVerify('rejected')}
                    className="px-4 py-2 border border-rose-200 text-rose-500 hover:bg-rose-50/50 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <X size={14} /> Reject Document Checks
                  </button>
                  <button
                    onClick={() => handleVerify('approved')}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Check size={14} /> Approve Verified Badge
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <ShieldAlert size={40} className="text-gray-300 mx-auto mb-4" />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                Verification queue is empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
