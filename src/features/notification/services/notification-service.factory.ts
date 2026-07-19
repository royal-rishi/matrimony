// ============================================================
// NOTIFICATION SERVICE FACTORY (Dependency Injection)
// Creates a fully-wired NotificationService instance with all
// providers registered. Import this in Server Actions and
// API Route Handlers.
//
// Usage:
//   const service = createNotificationService()
//   await service.createAndSend({ userId, eventType: MATCH_EVENTS.INTEREST_RECEIVED, ... })
// ============================================================

import { NotificationService } from '../services/notification.service'
import { SupabaseNotificationRepository } from '../services/notification.repository'
import { InAppNotificationProvider } from '../providers/in-app.provider'
import { EmailNotificationProvider } from '../providers/email.provider'
import { SmsNotificationProvider } from '../providers/sms.provider'
import { WhatsAppNotificationProvider } from '../providers/whatsapp.provider'
import type { INotificationProvider } from '../interfaces/notification-provider.interface'

/**
 * Factory function that wires together the repository and all providers.
 * Call this inside Server Actions / Route Handlers (server-side only).
 *
 * To add a new provider in a future phase:
 *   1. Create `providers/push.provider.ts` implementing INotificationProvider
 *   2. Import and add it to the `providers` array below
 *   3. Set `pushEnabled: true` in notification.config.ts
 */
export function createNotificationService(): NotificationService {
  const repository = new SupabaseNotificationRepository()

  const providers: INotificationProvider[] = [
    new InAppNotificationProvider(),
    new EmailNotificationProvider(),   // Phase 2 stub — disabled via isEnabled flag
    new SmsNotificationProvider(),     // Phase 2 stub — disabled via isEnabled flag
    new WhatsAppNotificationProvider(),
    // new PushNotificationProvider(), // Phase 3 — uncomment when ready
  ]

  return new NotificationService(repository, providers)
}
