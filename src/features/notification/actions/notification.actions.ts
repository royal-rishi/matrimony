'use server'

// ============================================================
// NOTIFICATION SERVER ACTIONS
// Next.js 15 Server Actions for all notification operations.
// These are the only server-side entry points for the module.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { createNotificationService } from '../services/notification-service.factory'
import {
  createNotificationSchema,
  markAsReadSchema,
  notificationFiltersSchema,
} from '../schemas/notification.schemas'
import type { CreateNotificationInput, NotificationFilters } from '../types/notification.types'

// ---- Helper: get authenticated user or throw ----
async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return user.id
}

// ---- Helper: standard action response shape ----
interface ActionResponse<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// createNotificationAction
// Used by other features to trigger a notification.
// ============================================================
export async function createNotificationAction(
  input: CreateNotificationInput
): Promise<ActionResponse<{ notificationId?: string }>> {
  try {
    const parsed = createNotificationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message }
    }

    const service = createNotificationService()
    const result = await service.createAndSend(parsed.data as CreateNotificationInput)

    return {
      success: result.success,
      data: { notificationId: result.notificationId },
      error: result.error,
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================================
// getUserNotificationsAction
// ============================================================
export async function getUserNotificationsAction(filters?: NotificationFilters) {
  try {
    const userId = await getAuthenticatedUserId()
    const parsedFilters = notificationFiltersSchema.safeParse(filters ?? {})
    if (!parsedFilters.success) {
      return { success: false, error: 'Invalid filters', data: null }
    }

    const service = createNotificationService()
    const result = await service.getUserNotifications(userId, parsedFilters.data)

    return { success: true, data: result, error: null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error', data: null }
  }
}

// ============================================================
// getUnreadCountAction
// ============================================================
export async function getUnreadCountAction(): Promise<ActionResponse<{ count: number }>> {
  try {
    const userId = await getAuthenticatedUserId()
    const service = createNotificationService()
    const count = await service.getUnreadCount(userId)
    return { success: true, data: { count } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================================
// markAsReadAction
// ============================================================
export async function markAsReadAction(notificationId: string): Promise<ActionResponse> {
  try {
    const userId = await getAuthenticatedUserId()
    const parsed = markAsReadSchema.safeParse({ notificationId })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message }
    }

    const service = createNotificationService()
    await service.markAsRead(notificationId, userId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================================
// markAllAsReadAction
// ============================================================
export async function markAllAsReadAction(): Promise<ActionResponse> {
  try {
    const userId = await getAuthenticatedUserId()
    const service = createNotificationService()
    await service.markAllAsRead(userId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============================================================
// deleteNotificationAction
// ============================================================
export async function deleteNotificationAction(notificationId: string): Promise<ActionResponse> {
  try {
    const userId = await getAuthenticatedUserId()
    const parsed = markAsReadSchema.safeParse({ notificationId })
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message }
    }

    const service = createNotificationService()
    await service.deleteNotification(notificationId, userId)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
