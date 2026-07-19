// ============================================================
// NOTIFICATION MODULE CONFIGURATION
// Central config object for the notification system.
// Environment-specific values are injected at runtime.
// ============================================================

import type { NotificationChannel } from '../interfaces/notification-provider.interface'
import type { NotificationPriority } from '../types/notification.types'
import { ALL_NOTIFICATION_EVENTS } from '../constants/notification-events.constants'
import { ACTIVE_CHANNELS } from '../constants/notification-channels.constants'

/**
 * Per-event routing configuration.
 * Defines default channels, priority, and template key for each event type.
 */
export interface EventRoutingConfig {
  /** Which channels to use by default for this event */
  channels: NotificationChannel[]
  /** Default priority for this event */
  priority: NotificationPriority
  /** Template key for looking up title/body templates */
  templateKey: string
  /** Whether this notification can be de-duplicated */
  deduplicatable: boolean
  /** De-duplication window in ms (if deduplicatable) */
  dedupWindowMs?: number
}

/**
 * Master event routing table.
 * Update this map whenever a new event type is added.
 */
export const EVENT_ROUTING_CONFIG: Record<string, EventRoutingConfig> = {
  // ---- Match Events ----
  [ALL_NOTIFICATION_EVENTS.INTEREST_RECEIVED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'match.interest_received',
    deduplicatable: true,
    dedupWindowMs: 60_000,
  },
  [ALL_NOTIFICATION_EVENTS.INTEREST_ACCEPTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'match.interest_accepted',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.INTEREST_REJECTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'normal',
    templateKey: 'match.interest_rejected',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.MATCH_CONNECTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'match.connected',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.PROFILE_VIEWED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'low',
    templateKey: 'match.profile_viewed',
    deduplicatable: true,
    dedupWindowMs: 3_600_000, // 1 hour
  },
  [ALL_NOTIFICATION_EVENTS.SHORTLISTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'normal',
    templateKey: 'match.shortlisted',
    deduplicatable: true,
    dedupWindowMs: 60_000,
  },
  [ALL_NOTIFICATION_EVENTS.PROFILE_LIKED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'normal',
    templateKey: 'match.profile_liked',
    deduplicatable: true,
    dedupWindowMs: 300_000,
  },

  // ---- Chat Events ----
  [ALL_NOTIFICATION_EVENTS.NEW_MESSAGE]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'chat.new_message',
    deduplicatable: true,
    dedupWindowMs: 5_000,
  },
  [ALL_NOTIFICATION_EVENTS.CHAT_REQUEST]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'chat.request',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.CHAT_REQUEST_ACCEPTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'chat.request_accepted',
    deduplicatable: false,
  },

  // ---- Profile Events ----
  [ALL_NOTIFICATION_EVENTS.PROFILE_VERIFIED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'profile.verified',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.PROFILE_REJECTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'profile.rejected',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.PHOTO_APPROVED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'normal',
    templateKey: 'profile.photo_approved',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.PHOTO_REJECTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'normal',
    templateKey: 'profile.photo_rejected',
    deduplicatable: false,
  },

  // ---- Payment Events ----
  [ALL_NOTIFICATION_EVENTS.SUBSCRIPTION_STARTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'payment.subscription_started',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'payment.subscription_expiring',
    deduplicatable: true,
    dedupWindowMs: 86_400_000, // 24 hours
  },
  [ALL_NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'urgent',
    templateKey: 'payment.subscription_expired',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.PAYMENT_FAILED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'urgent',
    templateKey: 'payment.payment_failed',
    deduplicatable: false,
  },

  // ---- Associate Events ----
  [ALL_NOTIFICATION_EVENTS.NEW_ASSIGNMENT]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'associate.new_assignment',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.COMMISSION_RELEASED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'associate.commission_released',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.MEETING_SCHEDULED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'associate.meeting_scheduled',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.WITHDRAWAL_APPROVED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'associate.withdrawal_approved',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.WITHDRAWAL_REJECTED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'high',
    templateKey: 'associate.withdrawal_rejected',
    deduplicatable: false,
  },

  // ---- System Events ----
  [ALL_NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT]: {
    channels: ACTIVE_CHANNELS,
    priority: 'normal',
    templateKey: 'system.announcement',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.MAINTENANCE_NOTICE]: {
    channels: ACTIVE_CHANNELS,
    priority: 'urgent',
    templateKey: 'system.maintenance',
    deduplicatable: false,
  },
  [ALL_NOTIFICATION_EVENTS.ACCOUNT_SUSPENDED]: {
    channels: ACTIVE_CHANNELS,
    priority: 'urgent',
    templateKey: 'system.account_suspended',
    deduplicatable: false,
  },
}

/**
 * Global runtime config for the Notification module.
 * Values sourced from environment variables at startup.
 */
export const NOTIFICATION_CONFIG = {
  /** Maximum concurrent provider dispatches per batch */
  maxConcurrentDispatches: parseInt(process.env.NOTIFICATION_MAX_CONCURRENT ?? '5', 10),

  /** Enable verbose logging (disable in production) */
  verboseLogging: process.env.NODE_ENV !== 'production',

  /** Retry attempts for failed provider calls */
  maxRetryAttempts: parseInt(process.env.NOTIFICATION_MAX_RETRIES ?? '3', 10),

  /** Base delay (ms) for exponential backoff between retries */
  retryBaseDelayMs: parseInt(process.env.NOTIFICATION_RETRY_DELAY_MS ?? '500', 10),

  /** Whether the in-app channel is active */
  inAppEnabled: true,

  /** Whether email channel is active (Phase 2) */
  emailEnabled: false,

  /** Whether SMS channel is active (Phase 2) */
  smsEnabled: false,

  /** Whether push notifications are active (Phase 3) */
  pushEnabled: false,

  /** Whether WhatsApp is active (Phase 4) */
  whatsappEnabled: false,
} as const
