'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Search, LogOut, PlusCircle, Check, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function AssociateHeader({
  fullName = 'Associate Profile',
  unreadNotificationsCount = 0,
}: {
  fullName?: string
  unreadNotificationsCount?: number
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(unreadNotificationsCount)
  const [profileOpen, setProfileOpen] = useState(false)
  const supabase = createClient() as any

  const fetchNotifications = React.useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('associate_notifications')
      .select('*')
      .eq('associate_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setNotifications(data)
    }
  }, [supabase])

  // Real-time listener for associate notifications
  useEffect(() => {
    setUnreadCount(unreadNotificationsCount)
    fetchNotifications()

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'associate_notifications' },
        (payload: any) => {
          setNotifications((prev) => [payload.new, ...prev])
          setUnreadCount((count) => count + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [unreadNotificationsCount, fetchNotifications, supabase])

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('associate_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('associate_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/associate/login')
  }

  return (
    <header className="flex items-center justify-between h-20 px-8 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
      {/* Search Bar / Context Title */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-64 max-w-lg hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search CRM cases or clients..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
        </div>
      </div>

      {/* Action items */}
      <div className="flex items-center gap-4">
        {/* Quick Create Link */}
        <Link
          href="/associate/cases"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <PlusCircle size={16} />
          <span className="hidden sm:inline">Add Matchmaking Case</span>
        </Link>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setProfileOpen(false)
            }}
            className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full text-gray-600 dark:text-gray-300 transition cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 block h-4 w-4 bg-rose-500 border border-white dark:border-gray-950 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-gray-500">
                    No new notifications.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition cursor-pointer',
                        !notif.is_read && 'bg-rose-50/20 dark:bg-rose-950/5'
                      )}
                    >
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {notif.body}
                      </p>
                      <span className="text-[9px] text-gray-400 block mt-1" suppressHydrationWarning>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen)
              setShowNotifications(false)
            }}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center font-bold text-white shadow">
              {fullName[0]?.toUpperCase()}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate mt-0.5">
                  {fullName}
                </p>
              </div>
              <div className="p-1.5 space-y-1">
                <Link
                  href="/associate/profile"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition cursor-pointer"
                >
                  <User size={14} /> My Profile & KYC
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition cursor-pointer"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
