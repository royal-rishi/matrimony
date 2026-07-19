'use client'

// ============================================================
// NOTIFICATION BELL COMPONENT
// Displays unread count badge with a dropdown notification list.
// Uses the useNotifications hook for real-time updates.
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import type { UserNotification } from '../types/notification.types'
import { useRouter } from 'next/navigation'

interface NotificationBellProps {
  userId: string | null
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-400',
  normal: 'bg-blue-500',
  low:    'bg-gray-400',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const {
    notifications,
    unreadCount,
    isLoading,
    hasNextPage,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications(userId)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleNotificationClick(n: UserNotification) {
    if (!n.isRead) markAsRead(n.id)
    if (n.actionUrl) router.push(n.actionUrl)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[520px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleNotificationClick(n)}
                  onDelete={() => deleteNotification(n.id)}
                />
              ))
            )}

            {/* Load More */}
            {hasNextPage && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Sub-component: Single Notification Item ----

interface NotificationItemProps {
  notification: UserNotification
  onClick: () => void
  onDelete: () => void
}

function NotificationItem({ notification: n, onClick, onDelete }: NotificationItemProps) {
  return (
    <div
      className={`
        group flex gap-3 px-4 py-3 cursor-pointer transition-colors
        hover:bg-gray-50 dark:hover:bg-gray-800/60
        ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}
        border-b border-gray-100 dark:border-gray-800 last:border-0
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Priority dot */}
      <div className="mt-1.5 flex-shrink-0">
        <span
          className={`inline-block w-2 h-2 rounded-full ${PRIORITY_COLORS[n.priority] ?? 'bg-gray-400'}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug text-gray-900 dark:text-white line-clamp-2 ${!n.isRead ? 'font-medium' : ''}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
      </div>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1 text-gray-300 hover:text-red-500 transition-all"
        aria-label="Delete notification"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
