'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { searchUsers, editUserProfile, banUser, mergeDuplicateAccounts, assignAssociateToClient } from '@/features/admin/actions/user-actions'
import { impersonateUserAction } from '@/features/admin/actions/impersonate-actions'
import { toast } from 'sonner'
import {
  Search,
  UserX,
  Edit2,
  GitMerge,
  Users,
  X,
  ShieldCheck,
  LogIn,
} from 'lucide-react'

export function UsersDatatable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [premiumFilter, setPremiumFilter] = useState('')

  // Drawer / Modals states
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isMergeOpen, setIsMergeOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)

  // Form states
  const [editForm, setEditForm] = useState<any>({})
  const [mergeForm, setMergeForm] = useState({ duplicateUserId: '', reason: '' })
  const [assignForm, setAssignForm] = useState({ associateId: '' })
  const [banReason, setBanReason] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const premiumVal = premiumFilter === 'true' ? true : premiumFilter === 'false' ? false : undefined
    const res = await searchUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      premium: premiumVal,
    })

    if (res.success && res.data) {
      setUsers(res.data)
    } else {
      toast.error(res.error || 'Failed to search users')
    }
    setLoading(false)
  }, [search, roleFilter, premiumFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleEditClick = (userObj: any) => {
    setSelectedUser(userObj)
    setEditForm({ ...userObj })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await editUserProfile(selectedUser.id, editForm)
    if (res.success) {
      toast.success('User updated successfully!')
      setIsEditOpen(false)
      loadUsers()
    } else {
      toast.error(res.error || 'Failed to edit user')
    }
  }

  const handleBanClick = async (userObj: any) => {
    if (!banReason.trim()) {
      const reasonInput = prompt('Enter a reason for banning this user:')
      if (!reasonInput) return
      setBanReason(reasonInput)
      const res = await banUser({ userId: userObj.id, reason: reasonInput, isPermanent: true })
      if (res.success) {
        toast.success('User banned and suspended!')
        loadUsers()
      } else {
        toast.error(res.error || 'Failed to ban user')
      }
    }
  }

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mergeForm.duplicateUserId.trim()) return
    const res = await mergeDuplicateAccounts({
      masterUserId: selectedUser.id,
      duplicateUserId: mergeForm.duplicateUserId,
      reason: mergeForm.reason,
    })

    if (res.success) {
      toast.success('Duplicate accounts merged!')
      setIsMergeOpen(false)
      loadUsers()
    } else {
      toast.error(res.error || 'Failed to merge accounts')
    }
  }

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.associateId.trim()) return
    const res = await assignAssociateToClient(selectedUser.id, assignForm.associateId)
    if (res.success) {
      toast.success('Associate assigned to client case successfully!')
      setIsAssignOpen(false)
      loadUsers()
    } else {
      toast.error(res.error || 'Failed to assign associate')
    }
  }

  const handleImpersonateClick = async (userObj: any) => {
    const confirmImpersonate = confirm(
      `Are you sure you want to impersonate ${userObj.first_name} ${userObj.last_name}? This will redirect you to their dashboard as this user.`
    )
    if (!confirmImpersonate) return

    const toastId = toast.loading('Initializing impersonation session...')
    const res = await impersonateUserAction(userObj.id)
    toast.dismiss(toastId)

    if (res.success) {
      toast.success(`Now impersonating ${userObj.first_name}!`)
      window.location.href = '/dashboard'
    } else {
      toast.error(res.error || 'Failed to start impersonation')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter tools */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, location, caste..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="user">Clients</option>
            <option value="local_associate">Local Associate</option>
            <option value="super_admin">Super Admins</option>
          </select>

          <select
            value={premiumFilter}
            onChange={(e) => setPremiumFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-white dark:bg-gray-950 focus:outline-none"
          >
            <option value="">All Tiers</option>
            <option value="true">Premium Elite</option>
            <option value="false">Free Tiers</option>
          </select>
        </div>
      </div>

      {/* Advanced Tables list */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 text-gray-400 uppercase tracking-widest font-black text-[9px]">
                <th className="p-4">Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Religion/Caste</th>
                <th className="p-4">Subscription</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition">
                    <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                      {u.first_name} {u.last_name}
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{u.role}</span>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {u.city}, {u.state}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {u.religion} {u.caste ? `/ ${u.caste}` : ''}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wider ${
                          u.is_premium
                            ? 'text-pink-600 bg-pink-500/10'
                            : 'text-gray-500 bg-gray-500/10'
                        }`}
                      >
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.is_verified ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className="text-gray-400 font-semibold">Unverified</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
                        title="Edit User"
                      >
                        <Edit2 size={13} />
                      </button>
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => handleImpersonateClick(u)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                          title="Impersonate User"
                        >
                          <LogIn size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser(u)
                          setIsAssignOpen(true)
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg text-blue-500 transition cursor-pointer"
                        title="Assign Associate"
                      >
                        <Users size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(u)
                          setIsMergeOpen(true)
                        }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg text-purple-500 transition cursor-pointer"
                        title="Merge Account"
                      >
                        <GitMerge size={13} />
                      </button>
                      <button
                        onClick={() => handleBanClick(u)}
                        className="p-1.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-lg text-rose-500 transition cursor-pointer"
                        title="Ban User"
                      >
                        <UserX size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Profile Edit Drawer */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-gray-950 h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-900 pb-4 mb-6">
                <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">
                  Edit Profile: {selectedUser?.first_name}
                </h3>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
                    <input
                      type="text"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
                    <input
                      type="text"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">City</label>
                  <input
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Occupation</label>
                  <input
                    type="text"
                    value={editForm.occupation || ''}
                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Premium Status</label>
                    <select
                      value={editForm.is_premium ? 'true' : 'false'}
                      onChange={(e) => setEditForm({ ...editForm, is_premium: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                    >
                      <option value="true">Premium active</option>
                      <option value="false">Free tier</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Subscription Tier</label>
                    <select
                      value={editForm.subscription_tier || 'free'}
                      onChange={(e) => setEditForm({ ...editForm, subscription_tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                    >
                      <option value="free">Free</option>
                      <option value="premium_gold">Premium Gold</option>
                      <option value="premium_platinum">Premium Platinum</option>
                      <option value="elite">Elite</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Gender</label>
                  <select
                    value={editForm.gender || ''}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-250 dark:border-gray-800 rounded-lg bg-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="female">Bride (Female)</option>
                    <option value="male">Groom (Male)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex gap-4 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200/50 dark:border-gray-850">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-is-featured"
                      checked={!!editForm.is_featured}
                      onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                      className="rounded text-pink-500 focus:ring-pink-500 h-4 w-4"
                    />
                    <label htmlFor="edit-is-featured" className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase cursor-pointer">
                      Featured Profile
                    </label>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-is-verified"
                      checked={!!editForm.is_verified}
                      onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                      className="rounded text-pink-500 focus:ring-pink-500 h-4 w-4"
                    />
                    <label htmlFor="edit-is-verified" className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase cursor-pointer">
                      Verified Badge
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-xl mt-6 cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Merge Accounts dialog */}
      {isMergeOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Merge Duplicate Account
            </h3>
            <p className="text-[10px] text-gray-400">
              Merging duplicate accounts will set the duplicate account as deleted and transfer CRM case logs to the master account ({selectedUser?.first_name}).
            </p>
            <form onSubmit={handleMergeSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Duplicate Profile UUID</label>
                <input
                  type="text"
                  placeholder="Enter duplicate user ID"
                  value={mergeForm.duplicateUserId}
                  onChange={(e) => setMergeForm({ ...mergeForm, duplicateUserId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Merge Reason</label>
                <textarea
                  placeholder="Reason for merge"
                  value={mergeForm.reason}
                  onChange={(e) => setMergeForm({ ...mergeForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent h-16"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMergeOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Confirm Merge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Associate Assignment dialog */}
      {isAssignOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="w-full max-w-sm bg-white dark:bg-gray-950 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">
              Assign Associate
            </h3>
            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Associate UUID</label>
                <input
                  type="text"
                  placeholder="Enter associate profile ID"
                  value={assignForm.associateId}
                  onChange={(e) => setAssignForm({ associateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-850 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-pink-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Assign Ownership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
