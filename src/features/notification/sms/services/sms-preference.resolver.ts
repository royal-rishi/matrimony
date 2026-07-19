// ============================================================
// SMS PREFERENCE RESOLVER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferencesRow } from '../../types/notification-database.types'

export class SMSPreferenceResolver {
  /**
   * Resolves whether the user has opted-in for SMS for the given event type.
   */
  async isSmsAllowed(userId: string, eventType: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await createClient()

    // 1. Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !preferences) {
      // If no preferences record exists, default to master SMS enabled = false (opt-in model)
      return { allowed: false, reason: 'No notification preferences record found.' }
    }

    const prefs = preferences as unknown as NotificationPreferencesRow

    // 2. Check master SMS channel toggle
    if (!prefs.sms_enabled) {
      return { allowed: false, reason: 'SMS notifications are disabled globally by the user.' }
    }

    // 3. Resolve category-level settings
    const category = this.getEventCategory(eventType)

    if (category === 'marketing' && !prefs.marketing_enabled) {
      return { allowed: false, reason: 'Marketing SMS notifications are disabled by the user.' }
    }
    if (category === 'payment' && !prefs.payment_enabled) {
      return { allowed: false, reason: 'Payment-related SMS notifications are disabled by the user.' }
    }
    if (category === 'associate' && !prefs.associate_enabled) {
      return { allowed: false, reason: 'Matchmaker associate SMS notifications are disabled by the user.' }
    }
    if (category === 'security' && !prefs.security_enabled) {
      return { allowed: false, reason: 'Security alert SMS notifications are disabled by the user.' }
    }

    // 4. Check Quiet Hours
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
  private getEventCategory(eventType: string): 'marketing' | 'payment' | 'associate' | 'security' | 'transactional' {
    if (eventType.startsWith('marketing.')) {
      return 'marketing'
    }
    if (eventType.startsWith('payment.')) {
      return 'payment'
    }
    if (eventType.startsWith('associate.')) {
      return 'associate'
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
   * Helper to check if current time is within user quiet hours range (HH:MM:SS format).
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
      // Quiet hours in same day (e.g. 22:00 to 08:00 — wait, 22:00 is larger than 08:00, that's overnight!)
      // Same day quiet hours (e.g. 13:00 to 15:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    } else {
      // Overnight quiet hours (e.g. 22:00 to 08:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes
    }
  }
}
