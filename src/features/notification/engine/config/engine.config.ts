// ============================================================
// CENTRAL NOTIFICATION ENGINE CONFIGURATION
// ============================================================

import type { NotificationChannel } from '../../interfaces/notification-provider.interface'

export const ENGINE_CONFIG = {
  globalDefaultChannels: ['in_app'] as NotificationChannel[],
  
  // Automated channel failovers if a primary provider is unhealthy or fails
  fallbacks: {
    whatsapp: ['sms'] as NotificationChannel[],
    sms: ['whatsapp'] as NotificationChannel[],
    email: [] as NotificationChannel[],
  },

  rateLimits: {
    maxPerUserPerMinute: 20,
    maxPerUserPerHour: 100,
  },

  // Suppression window for identical payloads (to prevent double clicks / loops)
  dedupWindowSeconds: 10,
}
