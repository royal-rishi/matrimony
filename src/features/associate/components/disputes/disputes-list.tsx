'use client'

import React, { useEffect, useState } from 'react'
import { getMyDisputes, escalateDispute } from '@/features/associate/actions/dispute-actions'
import { DisputeRespondModal } from './dispute-respond-modal'
import { toast } from 'sonner'
import { AlertCircle, ArrowUpCircle } from 'lucide-react'

export function DisputesList() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)

  useEffect(() => {
    loadDisputes()
  }, [])

  const loadDisputes = async () => {
    setLoading(true)
    const res = await getMyDisputes()
    if (res.success && res.data) {
      setDisputes(res.data)
    }
    setLoading(false)
  }

  const handleEscalate = async (disputeId: string) => {
    // Escalate to Super Admin (let's assume a default admin UUID, or query admin,
    // but in practice the escalatedTo will just be set to the resolve user profile id
    // which in a real system is known, let's mock or use the admin ID if exists)
    // We can escalate by setting the system default super admin or letting the backend handle it.
    // For scaffolding, we pass a mocked superadmin UUID
    const superAdminMockUuid = '00000000-0000-0000-0000-000000000000'
    const res = await escalateDispute({
      disputeId,
      escalatedTo: superAdminMockUuid,
    })

    if (res.success) {
      toast.success('Dispute escalated to Super Admin!')
      loadDisputes()
    } else {
      toast.error(res.error || 'Failed to escalate dispute')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30'
      case 'in_review':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/30'
      default:
        return 'bg-red-100 text-red-700 dark:bg-red-950/30'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Territorial Disputes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and resolve client complaints regarding matchmaking operations.
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950">
          <AlertCircle className="text-gray-300 w-12 h-12 mb-3" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">No Disputes Found</p>
          <p className="text-xs text-gray-400 mt-1">Great! You have no active dispute cases open.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((disp) => {
            const clientName = disp.client
              ? `${disp.client.first_name} ${disp.client.last_name}`
              : 'Anonymous Client'

            return (
              <div
                key={disp.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {disp.case?.case_number || 'General complaint'} | Client: {clientName}
                    </span>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mt-1">
                      {disp.title}
                    </h4>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusBadge(disp.status)}`}>
                    {disp.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {disp.description}
                </p>

                {disp.resolution_notes && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Your Statement</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{disp.resolution_notes}</p>
                  </div>
                )}

                {disp.status === 'open' && (
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setSelectedDisputeId(disp.id)}
                      className="px-4 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 transition cursor-pointer"
                    >
                      Respond Statement
                    </button>
                    <button
                      onClick={() => handleEscalate(disp.id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowUpCircle size={14} /> Escalate Admin
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedDisputeId && (
        <DisputeRespondModal
          disputeId={selectedDisputeId}
          onClose={() => setSelectedDisputeId(null)}
          onSuccess={loadDisputes}
        />
      )}
    </div>
  )
}
