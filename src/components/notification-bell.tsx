'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Heart, MessageSquare, CreditCard, User, ShieldCheck, Settings, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'interest' | 'chat' | 'payment' | 'associate' | 'verification' | 'system'
  is_read: boolean
  created_at: string
}

interface NotificationBellProps {
  initialNotifications: Notification[]
  userId: string
}

export function NotificationBell({ initialNotifications, userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Setup Supabase Realtime subscription for notifications
  useEffect(() => {
    const supabase = createClient()
    const uniqueToken = Math.random().toString(36).substring(2, 9)
    const channel = supabase
      .channel(`user-notifications-${userId}-${uniqueToken}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          
          // Display live toast notification
          toast(newNotif.title, {
            description: newNotif.message,
            duration: 5000,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return

    const supabase = createClient()
    const { error } = await (supabase.from('notifications') as any)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read.')
    } else {
      toast.error('Failed to mark notifications as read')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'interest':
        return <Heart className="h-4 w-4 text-pink-500 fill-pink-500/20" />
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'payment':
        return <CreditCard className="h-4 w-4 text-emerald-500" />
      case 'associate':
        return <User className="h-4 w-4 text-purple-500" />
      case 'verification':
        return <ShieldCheck className="h-4 w-4 text-teal-500" />
      default:
        return <Settings className="h-4 w-4 text-zinc-500" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-white transition duration-200 shadow-sm cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-pink-600 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[7px] text-white font-black animate-pulse" />
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-black text-pink-600 dark:text-pink-400 hover:text-pink-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition"
              >
                <Check className="h-3 w-3" /> Mark read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-850">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "p-4 transition duration-200 flex gap-3 text-xs",
                    !n.is_read ? "bg-pink-50/20 dark:bg-pink-950/5" : "hover:bg-zinc-50/40 dark:hover:bg-zinc-850/20"
                  )}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 h-fit">
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <p className={cn("font-bold text-zinc-800 dark:text-zinc-250", !n.is_read ? "text-pink-950 dark:text-pink-200" : "")}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap font-medium">
                        {new Date(n.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
