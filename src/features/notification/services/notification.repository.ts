// ============================================================
// SUPABASE NOTIFICATION REPOSITORY
// Concrete implementation of INotificationRepository.
// All Supabase DB operations for the notification module live here.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { INotificationRepository } from '../interfaces/notification-repository.interface'
import type {
  CreateNotificationInput,
  NotificationFilters,
  PaginatedNotifications,
  UserNotification,
} from '../types/notification.types'
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../constants/notification-channels.constants'
import { EVENT_ROUTING_CONFIG } from '../config/notification.config'
import { ACTIVE_CHANNELS } from '../constants/notification-channels.constants'

/**
 * Maps a raw Supabase `notifications` row to the domain UserNotification type.
 */
function mapRowToNotification(row: Record<string, unknown>): UserNotification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string,
    actionUrl: (row.action_url as string) ?? null,
    imageUrl: (row.image_url as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    priority: (row.priority as UserNotification['priority']) ?? 'normal',
    channels: (row.channels as UserNotification['channels']) ?? ACTIVE_CHANNELS,
    isRead: (row.is_read as boolean) ?? false,
    readAt: (row.read_at as string) ?? null,
    isDeleted: (row.is_deleted as boolean) ?? false,
    deletedAt: (row.deleted_at as string) ?? null,
    status: (row.status as UserNotification['status']) ?? 'dispatched',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export class SupabaseNotificationRepository implements INotificationRepository {
  private readonly TABLE = 'notifications' as const

  async create(input: CreateNotificationInput): Promise<UserNotification> {
    const supabase = await createClient()
    const routingConfig = EVENT_ROUTING_CONFIG[input.eventType]

    const { data, error } = await supabase
      .from(this.TABLE)
      .insert({
        user_id: input.userId,
        type: input.eventType,
        title: input.title ?? '',
        body: input.body ?? '',
        action_url: input.actionUrl ?? null,
        image_url: input.imageUrl ?? null,
        metadata: input.metadata ?? {},
        priority: input.priority ?? routingConfig?.priority ?? 'normal',
        channels: input.channels ?? routingConfig?.channels ?? ACTIVE_CHANNELS,
        is_read: false,
        is_deleted: false,
        status: 'dispatched',
      })
      .select()
      .single()

    if (error) throw new Error(`[NotificationRepository] create failed: ${error.message}`)
    return mapRowToNotification(data as Record<string, unknown>)
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<UserNotification[]> {
    const supabase = await createClient()

    const rows = inputs.map((input) => {
      const routingConfig = EVENT_ROUTING_CONFIG[input.eventType]
      return {
        user_id: input.userId,
        type: input.eventType,
        title: input.title ?? '',
        body: input.body ?? '',
        action_url: input.actionUrl ?? null,
        image_url: input.imageUrl ?? null,
        metadata: input.metadata ?? {},
        priority: input.priority ?? routingConfig?.priority ?? 'normal',
        channels: input.channels ?? routingConfig?.channels ?? ACTIVE_CHANNELS,
        is_read: false,
        is_deleted: false,
        status: 'dispatched',
      }
    })

    const { data, error } = await supabase.from(this.TABLE).insert(rows).select()
    if (error) throw new Error(`[NotificationRepository] createMany failed: ${error.message}`)
    return (data as Record<string, unknown>[]).map(mapRowToNotification)
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from(this.TABLE)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('is_deleted', false)

    if (error) throw new Error(`[NotificationRepository] markAsRead failed: ${error.message}`)
  }

  async markAllAsRead(userId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from(this.TABLE)
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_deleted', false)

    if (error) throw new Error(`[NotificationRepository] markAllAsRead failed: ${error.message}`)
  }

  async softDelete(notificationId: string, userId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from(this.TABLE)
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) throw new Error(`[NotificationRepository] softDelete failed: ${error.message}`)
  }

  async updateDeliveryStatus(
    notificationId: string,
    _channel: string,
    status: string,
    _externalMessageId?: string
  ): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from(this.TABLE)
      .update({ status })
      .eq('id', notificationId)

    if (error)
      throw new Error(`[NotificationRepository] updateDeliveryStatus failed: ${error.message}`)
  }

  async findByUserId(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<PaginatedNotifications> {
    const supabase = await createClient()
    const page = Math.max(1, filters.page ?? 1)
    const pageSize = Math.min(filters.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
    const offset = (page - 1) * pageSize

    let query = supabase
      .from(this.TABLE)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (filters.isRead !== undefined) query = query.eq('is_read', filters.isRead)
    if (filters.eventType) query = query.eq('type', filters.eventType)
    if (filters.priority) query = query.eq('priority', filters.priority)

    const { data, error, count } = await query

    if (error) throw new Error(`[NotificationRepository] findByUserId failed: ${error.message}`)

    const total = count ?? 0
    return {
      data: (data as Record<string, unknown>[]).map(mapRowToNotification),
      total,
      page,
      pageSize,
      hasNextPage: offset + pageSize < total,
      nextCursor:
        data && data.length > 0
          ? (data[data.length - 1] as Record<string, unknown>).created_at as string
          : undefined,
    }
  }

  async countUnread(userId: string): Promise<number> {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from(this.TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_deleted', false)

    if (error) throw new Error(`[NotificationRepository] countUnread failed: ${error.message}`)
    return count ?? 0
  }

  async findById(notificationId: string): Promise<UserNotification | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from(this.TABLE)
      .select('*')
      .eq('id', notificationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`[NotificationRepository] findById failed: ${error.message}`)
    }
    return mapRowToNotification(data as Record<string, unknown>)
  }

  async findByEventType(
    userId: string,
    eventType: string,
    sinceMs?: number
  ): Promise<UserNotification[]> {
    const supabase = await createClient()
    let query = supabase
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('type', eventType)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (sinceMs) {
      const since = new Date(Date.now() - sinceMs).toISOString()
      query = query.gte('created_at', since)
    }

    const { data, error } = await query
    if (error)
      throw new Error(`[NotificationRepository] findByEventType failed: ${error.message}`)
    return (data as Record<string, unknown>[]).map(mapRowToNotification)
  }
}
