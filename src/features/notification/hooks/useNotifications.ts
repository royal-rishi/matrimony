'use client'

// ============================================================
// useNotifications — React Client Hook
// Manages notification state with:
//  - Initial server data fetch
//  - Supabase Realtime subscription for instant delivery
//  - Optimistic read/delete mutations
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getUserNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from '../actions/notification.actions'
import type { NotificationFilters, PaginatedNotifications, UserNotification } from '../types/notification.types'
import { REALTIME_CHANNEL_PREFIX } from '../constants/notification-channels.constants'

interface UseNotificationsOptions {
  initialFilters?: NotificationFilters
  autoRefetch?: boolean
}

interface UseNotificationsReturn {
  notifications: UserNotification[]
  unreadCount: number
  isLoading: boolean
  hasNextPage: boolean
  total: number
  /** Load the next page (append to list) */
  loadMore: () => Promise<void>
  /** Mark a single notification as read */
  markAsRead: (notificationId: string) => Promise<void>
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>
  /** Delete (soft-delete) a notification */
  deleteNotification: (notificationId: string) => Promise<void>
  /** Manually trigger a data refetch */
  refetch: () => Promise<void>
}

export function useNotifications(
  userId: string | null,
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { initialFilters, autoRefetch = true } = options

  const [state, setState] = useState<{
    notifications: UserNotification[]
    unreadCount: number
    isLoading: boolean
    page: number
    hasNextPage: boolean
    total: number
  }>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    page: 1,
    hasNextPage: false,
    total: 0,
  })

  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  // ---- Fetch notifications ----
  const fetchPage = useCallback(
    async (page = 1, append = false) => {
      if (!userId) return
      setState((s) => ({ ...s, isLoading: true }))

      const [notifRes, countRes] = await Promise.all([
        getUserNotificationsAction({ ...initialFilters, page }),
        getUnreadCountAction(),
      ])

      if (notifRes.success && notifRes.data) {
        const paginated = notifRes.data as PaginatedNotifications
        setState((s) => ({
          ...s,
          notifications: append
            ? [...s.notifications, ...paginated.data]
            : paginated.data,
          total: paginated.total,
          hasNextPage: paginated.hasNextPage,
          page,
          isLoading: false,
        }))
      } else {
        setState((s) => ({ ...s, isLoading: false }))
      }

      if (countRes.success && countRes.data) {
        setState((s) => ({ ...s, unreadCount: countRes.data!.count }))
      }
    },
    [userId, initialFilters]
  )

  // ---- Initial fetch ----
  useEffect(() => {
    fetchPage(1, false)
  }, [fetchPage])

  // ---- Realtime subscription ----
  useEffect(() => {
    if (!userId || !autoRefetch) return

    const supabase = createClient()
    const channelName = `${REALTIME_CHANNEL_PREFIX}-${userId}`

    // Only subscribe if not already subscribed
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>
          const notification: UserNotification = {
            id: raw.id as string,
            userId: raw.user_id as string,
            type: raw.type as string,
            title: raw.title as string,
            body: raw.body as string,
            actionUrl: (raw.action_url as string) ?? null,
            imageUrl: (raw.image_url as string) ?? null,
            metadata: (raw.metadata as Record<string, unknown>) ?? {},
            priority: (raw.priority as UserNotification['priority']) ?? 'normal',
            channels: (raw.channels as UserNotification['channels']) ?? ['in_app'],
            isRead: false,
            readAt: null,
            isDeleted: false,
            deletedAt: null,
            status: 'dispatched',
            createdAt: raw.created_at as string,
            updatedAt: raw.updated_at as string,
          }

          setState((s) => ({
            ...s,
            notifications: [notification, ...s.notifications],
            unreadCount: s.unreadCount + 1,
            total: s.total + 1,
          }))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>
          setState((s) => ({
            ...s,
            notifications: s.notifications.map((n) =>
              n.id === updated.id
                ? { ...n, isRead: updated.is_read as boolean, readAt: (updated.read_at as string) ?? null }
                : n
            ),
          }))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [userId, autoRefetch])

  // ---- Actions ----

  const loadMore = useCallback(async () => {
    if (!state.hasNextPage || state.isLoading) return
    await fetchPage(state.page + 1, true)
  }, [state.hasNextPage, state.isLoading, state.page, fetchPage])

  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }))
    await markAsReadAction(notificationId)
  }, [])

  const markAllAsRead = useCallback(async () => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString(),
      })),
      unreadCount: 0,
    }))
    await markAllAsReadAction()
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    const wasUnread = state.notifications.find((n) => n.id === notificationId)?.isRead === false
    setState((s) => ({
      ...s,
      notifications: s.notifications.filter((n) => n.id !== notificationId),
      unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
      total: s.total - 1,
    }))
    await deleteNotificationAction(notificationId)
  }, [state.notifications])

  const refetch = useCallback(() => fetchPage(1, false), [fetchPage])

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    hasNextPage: state.hasNextPage,
    total: state.total,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  }
}
