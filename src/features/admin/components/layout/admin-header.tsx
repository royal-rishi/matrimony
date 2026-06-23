'use client'

import React, { useState } from 'react'
import { Bell, Search, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function AdminHeader({
  fullName = 'Ops Administrator',
  roleName = 'Super Admin',
}: {
  fullName?: string
  roleName?: string
}) {
  const router = useRouter()
  const [showNotifications, setShowNotifications] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/login')
  }

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* Search Input bar */}
      <div className="relative w-72 hidden md:block">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Quick search user profile, associate territory..."
          className="w-full pl-9 pr-4 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-1 focus:ring-pink-500/20"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer relative"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-gray-950 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Alerts Queue</span>
                <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest cursor-pointer">
                  Mark Read
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto p-2 space-y-1.5 text-xs text-gray-500 text-center py-6">
                No active critical system alarms or pendings.
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-md shadow-pink-500/10">
              {fullName[0]}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-gray-700 dark:text-gray-200">{fullName}</span>
              <span className="block text-[9px] font-black text-pink-500 uppercase tracking-wider mt-0.5 leading-none">
                {roleName}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl z-50 p-1.5">
              <Link
                href="/admin/settings"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition font-semibold"
              >
                RBAC Preferences
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition font-semibold cursor-pointer border-t border-gray-100 dark:border-gray-800 mt-1.5 pt-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
