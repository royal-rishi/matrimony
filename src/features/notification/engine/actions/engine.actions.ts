'use server'

// ============================================================
// CENTRAL ENGINE SERVER ACTIONS
// ============================================================

import { notificationEngine } from '../services/notification-engine'
import type { NotificationPriority } from '../../types/notification-database.types'
import type { NotificationChannel } from '../../interfaces/notification-provider.interface'

/**
 * Server Action: Instantly dispatches a notification.
 */
export async function dispatchNotification(
  userId: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  options: {
    channels?: NotificationChannel[]
    priority?: NotificationPriority
    metadata?: Record<string, any>
  } = {}
) {
  try {
    const result = await notificationEngine.dispatch({
      userId,
      eventType,
      variables,
      channels: options.channels,
      priority: options.priority,
      metadata: options.metadata,
    })

    return {
      success: result.success,
      notificationId: result.notificationId,
      channelResults: result.channelResults,
      error: result.error,
    }
  } catch (err) {
    console.error('[dispatchNotification Server Action] Failure:', err)
    return { success: false, error: 'Internal server error.' }
  }
}

/**
 * Server Action: Schedules a future notification.
 */
export async function scheduleNotification(
  userId: string,
  eventType: string,
  variables: Record<string, string | number | boolean> = {},
  scheduledFor: string, // ISO Date String
  options: {
    channels?: NotificationChannel[]
    priority?: NotificationPriority
    metadata?: Record<string, any>
  } = {}
) {
  try {
    const date = new Date(scheduledFor)
    if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return { success: false, error: 'Invalid scheduling date. Must be in the future.' }
    }

    const result = await notificationEngine.schedule(
      {
        userId,
        eventType,
        variables,
        channels: options.channels,
        priority: options.priority,
        metadata: options.metadata,
      },
      date
    )

    return {
      success: result.success,
      notificationId: result.notificationId,
      channelResults: result.channelResults,
      error: result.error,
    }
  } catch (err) {
    console.error('[scheduleNotification Server Action] Failure:', err)
    return { success: false, error: 'Internal server error.' }
  }
}

/**
 * Server Action: Retries a failed message manually from the queue.
 */
export async function retryNotification(whatsappQueueId: string) {
  try {
    return await notificationEngine.retry(whatsappQueueId)
  } catch (err) {
    console.error('[retryNotification Server Action] Failure:', err)
    return { success: false, error: 'Internal server error.' }
  }
}

/**
 * Server Action: Cancels a scheduled message.
 */
export async function cancelNotification(notificationId: string) {
  try {
    const success = await notificationEngine.cancel(notificationId)
    return { success }
  } catch (err) {
    console.error('[cancelNotification Server Action] Failure:', err)
    return { success: false, error: 'Internal server error.' }
  }
}
