'use client'

// ============================================================
// NOTIFICATION LIST COMPONENT
// Full-page notification list with filters, pagination and
// empty state. Suitable for a /notifications page.
// ============================================================

import { useState } from 'react'
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import type { NotificationFilters } from '../types/notification.types'

interface NotificationListProps {
  userId: string
}

const FILTER_TABS = [
  { label: 'All', value: undefined },
  { label: 'Unread', value: false },
  { label: 'Read', value: true },
] as const

export function NotificationList({ userId }: NotificationListProps) {
  const [activeTab, setActiveTab] = useState<boolean | undefined>(undefined)
  const filters: NotificationFilters = { isRead: activeTab }

  const {
    notifications,
    unreadCount,
    isLoading,
    hasNextPage,
    total,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
  } = useNotifications(userId, { initialFilters: filters })

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {total} total · {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-400 self-center" />
        {FILTER_TABS.map((tab) => (
          <button
            key={String(tab.value)}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-rose-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading && notifications.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Bell className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {activeTab === false ? 'All caught up!' : 'You have no notifications yet.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`
                flex gap-4 p-4 rounded-xl border transition-colors
                ${!n.isRead
                  ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }
              `}
            >
              {/* Unread dot */}
              {!n.isRead && (
                <div className="flex-shrink-0 mt-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm text-gray-900 dark:text-white ${!n.isRead ? 'font-semibold' : ''}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1.5">
                  {new Date(n.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load more notifications'}
          </button>
        </div>
      )}
    </div>
  )
}
