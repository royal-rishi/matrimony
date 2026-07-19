// ============================================================
// NOTIFICATION MODULE — PUBLIC API INDEX
// This is the single barrel export for the notification feature.
// All consumers should import from here, not from sub-paths.
// ============================================================

// ---- Types ----
export type {
  UserNotification,
  CreateNotificationInput,
  NotificationResult,
  ChannelResult,
  NotificationFilters,
  PaginatedNotifications,
  NotificationPayload,
  NotificationPriority,
  NotificationStatus,
  ProviderHealthStatus,
  NotificationRealtimePayload,
} from './types/notification.types'

// ---- Interfaces ----
export type { INotificationService } from './interfaces/notification-service.interface'
export type { INotificationProvider } from './interfaces/notification-provider.interface'
export type { INotificationRepository } from './interfaces/notification-repository.interface'
export type { NotificationChannel, DeliveryStatus } from './interfaces/notification-provider.interface'
export type {
  NotificationPreferences,
  ChannelPreference,
  INotificationPreferenceService,
} from './interfaces/notification-service.interface'

// ---- Constants ----
export {
  MATCH_EVENTS,
  CHAT_EVENTS,
  PROFILE_EVENTS,
  PAYMENT_EVENTS,
  ASSOCIATE_EVENTS,
  SYSTEM_EVENTS,
  OTP_EVENTS,
  ALL_NOTIFICATION_EVENTS,
} from './constants/notification-events.constants'
export type { NotificationEventType } from './constants/notification-events.constants'
export {
  NOTIFICATION_CHANNELS,
  ACTIVE_CHANNELS,
  MAX_NOTIFICATIONS_PER_USER,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  NOTIFICATION_RETENTION_DAYS,
  REALTIME_CHANNEL_PREFIX,
  DEDUP_WINDOW_MS,
} from './constants/notification-channels.constants'

// ---- Config ----
export { NOTIFICATION_CONFIG, EVENT_ROUTING_CONFIG } from './config/notification.config'
export type { EventRoutingConfig } from './config/notification.config'
export {
  NOTIFICATION_TEMPLATES,
  interpolateTemplate,
  resolveTemplate,
} from './config/notification-templates.config'

// ---- Schemas ----
export {
  createNotificationSchema,
  createNotificationBatchSchema,
  markAsReadSchema,
  notificationFiltersSchema,
  updateNotificationPreferencesSchema,
} from './schemas/notification.schemas'

// ---- Service Factory ----
export { createNotificationService } from './services/notification-service.factory'

// ---- Server Actions ----
export {
  createNotificationAction,
  getUserNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
} from './actions/notification.actions'

// ---- Hooks (client-only) ----
export { useNotifications } from './hooks/useNotifications'

// ---- Components (client-only) ----
export { NotificationBell } from './components/notification-bell'
export { NotificationList } from './components/notification-list'

// ---- Event Bus ----
export { notificationEventBus } from './events/notification.event-bus'

// ---- Queue ----
export { notificationQueue } from './queues/notification.queue'

// ---- OTP (stubs) ----
export type {
  IOtpProvider,
  OtpPurpose,
  SendOtpInput,
  VerifyOtpInput,
  OtpResult,
  OtpVerificationResult,
} from './otp/otp.service'
export { OtpServiceStub } from './otp/otp.service'
