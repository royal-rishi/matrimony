// ============================================================
// NOTIFICATION PREFERENCE CORE SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { UserPreferencesData } from '../types/preferences.types'
import { PREFERENCES_CONFIG } from '../config/preferences.config'
import { PreferenceValidator } from '../validators/preferences.validator'
import { PreferenceSyncService } from './preference-sync.service'
import { PreferenceLogger } from '../utils/preferences.logger'

export class NotificationPreferenceService {
  /**
   * Fetches user notification preferences, seeding defaults if missing.
   */
  async getPreferences(userId: string): Promise<UserPreferencesData> {
    const supabase = await createClient()

    const { data: row, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !row) {
      // Preferences not initialized yet; seed default factory values
      const defaults = PREFERENCES_CONFIG.defaultPreferences
      const seeded = {
        user_id: userId,
        in_app_enabled: defaults.inAppEnabled,
        email_enabled: defaults.emailEnabled,
        sms_enabled: defaults.smsEnabled,
        push_enabled: defaults.pushEnabled,
        whatsapp_enabled: defaults.whatsappEnabled,
        quiet_hours_start: defaults.quietHoursStart,
        quiet_hours_end: defaults.quietHoursEnd,
        otp_preference: defaults.otpPreference,
        fallback_enabled: defaults.autoFallback,
        marketing_enabled: defaults.categories.email.marketing,
        security_enabled: defaults.categories.email.security,
        payment_enabled: defaults.categories.email.payment,
        associate_enabled: defaults.categories.email.associate,
        match_digest_enabled: defaults.categories.email.matchDigest,
        weekly_digest_enabled: defaults.categories.email.weeklyDigest,
        event_preferences: {
          language: defaults.language,
          timezone: defaults.timezone,
          privacy: defaults.privacy,
          digest: defaults.digest,
          categories: defaults.categories,
        },
      }

      await supabase.from('notification_preferences').upsert(seeded)

      return {
        userId,
        inAppEnabled: defaults.inAppEnabled,
        emailEnabled: defaults.emailEnabled,
        smsEnabled: defaults.smsEnabled,
        pushEnabled: defaults.pushEnabled,
        whatsappEnabled: defaults.whatsappEnabled,
        quietHoursStart: defaults.quietHoursStart,
        quietHoursEnd: defaults.quietHoursEnd,
        timezone: defaults.timezone,
        language: defaults.language,
        otpPreference: defaults.otpPreference,
        autoFallback: defaults.autoFallback,
        privacy: defaults.privacy,
        digest: defaults.digest,
        categories: defaults.categories,
      }
    }

    // Map database row to domain types structure
    const eventPrefs = row.event_preferences || {}
    const defaults = PREFERENCES_CONFIG.defaultPreferences

    return {
      userId: row.user_id,
      inAppEnabled: row.in_app_enabled,
      emailEnabled: row.email_enabled,
      smsEnabled: row.sms_enabled,
      pushEnabled: row.push_enabled,
      whatsappEnabled: row.whatsapp_enabled,
      quietHoursStart: row.quiet_hours_start,
      quietHoursEnd: row.quiet_hours_end,
      otpPreference: (row.otp_preference || defaults.otpPreference) as any,
      autoFallback: row.fallback_enabled ?? defaults.autoFallback,
      
      // Loaded from JSONB event_preferences
      timezone: eventPrefs.timezone || row.timezone || defaults.timezone,
      language: eventPrefs.language || row.language || defaults.language,
      privacy: eventPrefs.privacy || defaults.privacy,
      digest: eventPrefs.digest || defaults.digest,
      categories: eventPrefs.categories || defaults.categories,
    }
  }

  /**
   * Updates user preferences. Validates values, applies constraints, and syncs to Notification Engine.
   */
  async updatePreferences(
    userId: string,
    updates: Partial<UserPreferencesData>
  ): Promise<{ success: boolean; data?: UserPreferencesData; error?: string }> {
    try {
      // 1. Fetch current preferences
      const current = await this.getPreferences(userId)

      // 2. Prevent duplicate write executions
      if (PreferenceValidator.isDuplicateUpdate(current, updates)) {
        return { success: true, data: current }
      }

      // Merge incoming changes
      const merged: UserPreferencesData = {
        userId,
        inAppEnabled: updates.inAppEnabled !== undefined ? updates.inAppEnabled : current.inAppEnabled,
        emailEnabled: updates.emailEnabled !== undefined ? updates.emailEnabled : current.emailEnabled,
        smsEnabled: updates.smsEnabled !== undefined ? updates.smsEnabled : current.smsEnabled,
        pushEnabled: updates.pushEnabled !== undefined ? updates.pushEnabled : current.pushEnabled,
        whatsappEnabled: updates.whatsappEnabled !== undefined ? updates.whatsappEnabled : current.whatsappEnabled,
        quietHoursStart: updates.quietHoursStart !== undefined ? updates.quietHoursStart : current.quietHoursStart,
        quietHoursEnd: updates.quietHoursEnd !== undefined ? updates.quietHoursEnd : current.quietHoursEnd,
        timezone: updates.timezone !== undefined ? updates.timezone : current.timezone,
        language: updates.language !== undefined ? updates.language : current.language,
        otpPreference: updates.otpPreference !== undefined ? updates.otpPreference : current.otpPreference,
        autoFallback: updates.autoFallback !== undefined ? updates.autoFallback : current.autoFallback,
        privacy: updates.privacy !== undefined ? updates.privacy : current.privacy,
        digest: updates.digest !== undefined ? updates.digest : current.digest,
        categories: updates.categories !== undefined ? updates.categories : current.categories,
      }

      // 3. Run validation rules
      const val = PreferenceValidator.validate(merged)
      if (!val.isValid) {
        return { success: false, error: val.errors.join(' ') }
      }

      const supabase = await createClient()

      // Map back to database columns
      const dbPayload = {
        in_app_enabled: merged.inAppEnabled,
        email_enabled: merged.emailEnabled,
        sms_enabled: merged.smsEnabled,
        push_enabled: merged.pushEnabled,
        whatsapp_enabled: merged.whatsappEnabled,
        quiet_hours_start: merged.quietHoursStart,
        quiet_hours_end: merged.quietHoursEnd,
        otp_preference: merged.otpPreference,
        fallback_enabled: merged.autoFallback,
        
        // Sync categories to column triggers for backwards compatibility
        marketing_enabled: merged.categories.email.marketing,
        security_enabled: merged.categories.email.security,
        payment_enabled: merged.categories.email.payment,
        associate_enabled: merged.categories.email.associate,
        match_digest_enabled: merged.categories.email.matchDigest,
        weekly_digest_enabled: merged.categories.email.weeklyDigest,
        
        event_preferences: {
          language: merged.language,
          timezone: merged.timezone,
          privacy: merged.privacy,
          digest: merged.digest,
          categories: merged.categories,
        },
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('notification_preferences')
        .update(dbPayload)
        .eq('user_id', userId)

      if (error) {
        console.error('[NotificationPreferenceService] Update failed:', error)
        return { success: false, error: 'Database update failed.' }
      }

      // 4. Audit Log & Sync
      await PreferenceLogger.logChange(userId, updates)
      await PreferenceSyncService.syncPreferences(userId, merged)

      return { success: true, data: merged }
    } catch (err) {
      console.error('[NotificationPreferenceService] Exception:', err)
      return { success: false, error: err instanceof Error ? err.message : 'Unknown preferences service exception.' }
    }
  }

  /**
   * Resets all choices back to factory defaults.
   */
  async resetPreferences(userId: string): Promise<UserPreferencesData | null> {
    const defaults = PREFERENCES_CONFIG.defaultPreferences
    const res = await this.updatePreferences(userId, defaults)
    return res.success ? res.data! : null
  }
}
