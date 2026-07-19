// ============================================================
// EMAIL PREFERENCE RESOLVER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferencesRow } from '../../types/notification-database.types'

export class EmailPreferenceResolver {
  /**
   * Resolves whether the user has opted-in to receive emails for the given event type.
   */
  async isEmailAllowed(userId: string, eventType: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await createClient()

    // 1. Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !preferences) {
      // Default to allowed: true for transactional emails if preferences aren't seeded yet
      return { allowed: true }
    }

    const prefs = preferences as unknown as NotificationPreferencesRow

    // 2. Check master Email channel toggle
    if (!prefs.email_enabled) {
      return { allowed: false, reason: 'Email notifications are disabled globally by the user.' }
    }

    // 3. Resolve category-level settings
    const category = this.getEventCategory(eventType)

    if (category === 'marketing' && !prefs.marketing_enabled) {
      return { allowed: false, reason: 'Marketing email notifications are disabled by the user.' }
    }
    if (category === 'payment' && !prefs.payment_enabled) {
      return { allowed: false, reason: 'Payment email notifications are disabled by the user.' }
    }
    if (category === 'associate' && !prefs.associate_enabled) {
      return { allowed: false, reason: 'Matchmaker associate email notifications are disabled by the user.' }
    }
    if (category === 'security' && !prefs.security_enabled) {
      return { allowed: false, reason: 'Security email notifications are disabled by the user.' }
    }
    if (category === 'daily_digest' && !prefs.match_digest_enabled) {
      return { allowed: false, reason: 'Daily matchmaking digest emails are disabled by the user.' }
    }
    if (category === 'weekly_digest' && !prefs.weekly_digest_enabled) {
      return { allowed: false, reason: 'Weekly matchmaking digest emails are disabled by the user.' }
    }

    // 4. Quiet Hours
    const isQuiet = this.isWithinQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)
    if (isQuiet) {
      // Critical security alerts bypass quiet hours
      const isCritical = eventType.startsWith('system.security_alert') || eventType.startsWith('system.fraud_alert')
      if (!isCritical) {
        return { allowed: false, reason: 'Current time is within user quiet hours.' }
      }
    }

    return { allowed: true }
  }

  /**
   * Maps event type strings to preference categories.
   */
  private getEventCategory(eventType: string): 'marketing' | 'payment' | 'associate' | 'security' | 'daily_digest' | 'weekly_digest' | 'transactional' {
    if (eventType.startsWith('marketing.')) {
      return 'marketing'
    }
    if (eventType.startsWith('payment.')) {
      return 'payment'
    }
    if (eventType.startsWith('associate.')) {
      return 'associate'
    }
    if (eventType === 'matchmaking.daily_digest') {
      return 'daily_digest'
    }
    if (eventType === 'matchmaking.weekly_digest') {
      return 'weekly_digest'
    }
    if (
      eventType.startsWith('system.security_alert') ||
      eventType.startsWith('system.fraud_alert') ||
      eventType.startsWith('system.new_device_login') ||
      eventType.startsWith('system.email_changed') ||
      eventType.startsWith('system.mobile_changed')
    ) {
      return 'security'
    }
    return 'transactional'
  }

  /**
   * Helper to check if current time is within quiet hours (HH:MM:SS format).
   */
  private isWithinQuietHours(start: string | null, end: string | null): boolean {
    if (!start || !end) return false

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)

    if (startH === undefined || startM === undefined || endH === undefined || endM === undefined) {
      return false
    }

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }
}
