// ============================================================
// NOTIFICATION CHANNEL CONSTANTS
// Defines which delivery channels are supported and their metadata.
// ============================================================

import type { NotificationChannel } from '../interfaces/notification-provider.interface'

export const NOTIFICATION_CHANNELS: Record<
  NotificationChannel,
  { label: string; icon: string; description: string; phaseAvailable: number }
> = {
  in_app: {
    label: 'In-App',
    icon: 'Bell',
    description: 'Real-time notifications inside the RishtaJodo app',
    phaseAvailable: 1,
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    description: 'Transactional emails via Resend / AWS SES',
    phaseAvailable: 2,
  },
  sms: {
    label: 'SMS',
    icon: 'MessageSquare',
    description: 'SMS via MSG91 / Twilio',
    phaseAvailable: 2,
  },
  push: {
    label: 'Push Notification',
    icon: 'Smartphone',
    description: 'Mobile push via FCM / APNs',
    phaseAvailable: 3,
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'MessageCircle',
    description: 'WhatsApp Business API messages',
    phaseAvailable: 4,
  },
}

/** Channels available in the current phase (Phase 1) */
export const ACTIVE_CHANNELS: NotificationChannel[] = ['in_app']

/** Max notifications to store per user (for housekeeping) */
export const MAX_NOTIFICATIONS_PER_USER = 500

/** Default page size for notification list queries */
export const DEFAULT_PAGE_SIZE = 20

/** Maximum allowed page size */
export const MAX_PAGE_SIZE = 100

/** How long to keep read notifications before soft-purge (days) */
export const NOTIFICATION_RETENTION_DAYS = 90

/** Realtime Supabase channel name prefix */
export const REALTIME_CHANNEL_PREFIX = 'user-notifications'

/** De-duplication window: ignore identical events within N milliseconds */
export const DEDUP_WINDOW_MS = 5_000
