'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getAssociates, approveAssociate, suspendAssociate, assignTerritory, getAssociatePerformance } from '@/features/admin/actions/associate-actions'
import { impersonateUserAction } from '@/features/admin/actions/impersonate-actions'
import { toast } from 'sonner'
import {
  Search,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Map,
  TrendingUp,
  X,
  LogIn,
} from 'lucide-react'

export function AssociateNetworkManager() {
  const [associates, setAssociates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Details drawer / Modals
  const [selectedAssoc, setSelectedAssoc] = useState<any>(null)
  const [perfData, setPerfData] = useState<any>(null)
  const [isTerritoryOpen, setIsTerritoryOpen] = useState(false)

  // Form states
  const [territoryForm, setTerritoryForm] = useState({ state: '', district: '', block: '' })

  const loadAssociates = useCallback(async () => {
    setLoading(true)
    const res = await getAssociates({
      search: search || undefined,
      status: statusFilter || undefined,
    })

    if (res.success && res.data) {
      setAssociates(res.data)
    } else {
      toast.error(res.error || 'Failed to fetch associates')
    }
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    loadAssociates()
  }, [loadAssociates])

  const handleApprove = async (assocId: string, approved: boolean) => {
    const notes = prompt(`Enter verification review notes for this associate KYC:`)
    if (notes === null) return

    const res = await approveAssociate({ associateId: assocId, approved, notes })
    if (res.success) {
      toast.success(approved ? 'Associate KYC approved and status set to active!' : 'Associate KYC rejected')
      loadAssociates()
    } else {
      toast.error(res.error || 'KYC review failed')
    }
  }

  const handleSuspend = async (assocId: string, suspend: boolean) => {
    const reason = prompt(`Enter reason for ${suspend ? 'suspension' : 're-activation'}:`)
    if (!reason) return

    const res = await suspendAssociate(assocId, suspend, reason)
    if (res.success) {
      toast.success(suspend ? 'Associate account suspended!' : 'Associate account re-activated!')
      loadAssociates()
    } else {
      toast.error(res.error || 'Action failed')
    }
  }

  const handleTerritorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await assignTerritory({
      associateId: selectedAssoc.id,
      state: territoryForm.state,
      district: territoryForm.district || undefined,
      block: territoryForm.block || undefined,
    })

    if (res.success) {
      toast.success('Territory bounds updated successfully!')
      setIsTerritoryOpen(false)
      loadAssociates()
    } else {
      toast.error(res.error || 'Failed to assign territory')
    }
  }

  const handleViewPerformance = async (assoc: any) => {
    setSelectedAssoc(assoc)
    setPerfData(null)
    const res = await getAssociatePerformance(assoc.id)
    if (res.success && res.data) {
      setPerfData(res.data)
    } else {
      toast.error('Failed to load performance metrics')
    }
  }

  const handleImpersonateClick = async (assocObj: any) => {
    const name = `${assocObj.profile?.first_name || ''} ${assocObj.profile?.last_name || ''}`.trim() || 'Associate'
    const confirmImpersonate = confirm(
      `Are you sure you want to impersonate associate ${name}? This will redirect you to the associate dashboard.`
    )
    if (!confirmImpersonate) return

    const toastId = toast.loading('Initializing impersonation session...')
    const res = await impersonateUserAction(assocObj.id)
    toast.dismiss(toastId)

    if (res.success) {
      toast.success(`Now impersonating ${assocObj.profile?.first_name || 'Associate'}!`)
      window.location.href = '/associate/dashboard'
    } else {
      toast.error(res.error || 'Failed to start impersonation')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search associates network..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_kyc">Pending KYC Checks</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Grid Layout splits list & details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden h-fit">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px] p-4">
                  <th className="p-4">Associate</th>
                  <th className="p-4">KYC Review</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      Loading associates...
                    </td>
                  </tr>
                ) : associates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      No associates in list.
                    </td>
                  </tr>
                ) : (
                  associates.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition cursor-pointer" onClick={() => handleViewPerformance(a)}>
                      <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {a.profile?.first_name} {a.profile?.last_name}
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{a.profile?.city}, {a.profile?.state}</span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${a.kyc?.kyc_status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {a.kyc?.kyc_status || 'not_submitted'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-[9px] uppercase tracking-wider font-bold ${
                          a.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                          a.status === 'suspended' ? 'bg-red-500/10 text-red-600' : 'bg-gray-100 dark:bg-gray-900 text-gray-500'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        {a.status === 'pending_kyc' && (
                          <>
                            <button onClick={() => handleApprove(a.id, true)} className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 rounded-lg cursor-pointer">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => handleApprove(a.id, false)} className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-lg cursor-pointer">
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {a.status === 'active' && (
                          <button onClick={() => handleSuspend(a.id, true)} className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 rounded-lg cursor-pointer" title="Suspend Associate">
                            <AlertOctagon size={14} />
                          </button>
                        )}
                        {a.status === 'suspended' && (
                          <button onClick={() => handleSuspend(a.id, false)} className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 rounded-lg cursor-pointer" title="Activate Associate">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => { setSelectedAssoc(a); setIsTerritoryOpen(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg cursor-pointer" title="Assign Territory">
                          <Map size={14} />
                        </button>
                        <button
                          onClick={() => handleImpersonateClick(a)}
                          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 rounded-lg cursor-pointer"
                          title="Impersonate Associate"
                        >
                          <LogIn size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Associate CRM stats card */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm h-fit space-y-6">
          {selectedAssoc ? (
            <>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-pink-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
                  {selectedAssoc.profile?.first_name[0]}{selectedAssoc.profile?.last_name[0]}
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white mt-4">
                  {selectedAssoc.profile?.first_name} {selectedAssoc.profile?.last_name}
                </h3>
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                  Associate ID: {selectedAssoc.id.substring(0, 8)}
                </span>
              </div>

              {perfData ? (
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-900 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Average Rating</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      ★ {Number(perfData.averageRating).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Wallet Balance</span>
                    <span className="font-semibold text-emerald-500">
                      ₹{Number(perfData.walletBalance).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Cases Managed</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{perfData.totalCases} cases</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Success Stories</span>
                    <span className="font-semibold text-pink-500 flex items-center gap-1">
                      <TrendingUp size={13} /> {perfData.marriageSuccesses} marriages
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Referrals Invited</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{perfData.totalReferrals} users</span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-xs text-gray-400 py-6">Loading performance metrics...</p>
              )}
            </>
          ) : (
            <p className="text-center text-xs text-gray-400 py-12">Select an associate to view details.</p>
          )}
        </div>
      </div>

      {/* Territory Assignment Modal */}
      {isTerritoryOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
                Assign Territory: {selectedAssoc?.profile?.first_name}
              </h3>
              <button onClick={() => setIsTerritoryOpen(false)} className="text-gray-400 hover:text-gray-950 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleTerritorySubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={territoryForm.state}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">District (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={territoryForm.district}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Block (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Haveli"
                  value={territoryForm.block}
                  onChange={(e) => setTerritoryForm({ ...territoryForm, block: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Save Territory
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
