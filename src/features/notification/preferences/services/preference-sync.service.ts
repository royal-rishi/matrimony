// ============================================================
// PREFERENCES SYNCHRONIZATION SERVICE
// ============================================================

import { eventBus } from '../../engine/events/event-bus'
import type { UserPreferencesData } from '../types/preferences.types'

export class PreferenceSyncService {
  /**
   * Syncs and publishes preference updates to the central Notification Engine and Event Bus.
   */
  static async syncPreferences(userId: string, preferences: UserPreferencesData): Promise<void> {
    try {
      console.log(`[PreferenceSyncService] Syncing preferences for user ${userId} to Notification Engine.`)

      // Publish to Event Bus for active subscribers (e.g. caches updates, triggers push tokens registration, etc.)
      await eventBus.publish('user.preferences_updated', {
        userId,
        eventType: 'user.preferences_updated',
        variables: {
          email_enabled: preferences.emailEnabled,
          sms_enabled: preferences.smsEnabled,
          whatsapp_enabled: preferences.whatsappEnabled,
          language: preferences.language,
          timezone: preferences.timezone,
        },
        metadata: {
          preferences,
        },
      })
    } catch (err) {
      console.error('[PreferenceSyncService] Synchronization failed:', err)
    }
  }
}
