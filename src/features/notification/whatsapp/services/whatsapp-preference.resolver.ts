// ============================================================
// WHATSAPP PREFERENCE RESOLVER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { NotificationPreferencesRow } from '../../types/notification-database.types'

export class WhatsAppPreferenceResolver {
  /**
   * Resolves whether the user has opted-in for WhatsApp for the given event type.
   */
  async isWhatsAppAllowed(userId: string, eventType: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = await createClient()

    // 1. Fetch user preferences
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !preferences) {
      // Default to enabled: false for opt-in policy
      return { allowed: false, reason: 'No notification preferences record found.' }
    }

    const prefs = preferences as unknown as NotificationPreferencesRow

    // 2. Check master WhatsApp channel toggle
    if (!prefs.whatsapp_enabled) {
      return { allowed: false, reason: 'WhatsApp notifications are disabled globally by the user.' }
    }

    // 3. Resolve category-level settings
    const category = this.getEventCategory(eventType)

    if (category === 'marketing' && !prefs.marketing_enabled) {
      return { allowed: false, reason: 'Marketing messages are disabled by the user.' }
    }
    if (category === 'payment' && !prefs.payment_enabled) {
      return { allowed: false, reason: 'Payment messages are disabled by the user.' }
    }
    if (category === 'associate' && !prefs.associate_enabled) {
      return { allowed: false, reason: 'Matchmaker associate messages are disabled by the user.' }
    }
    if (category === 'security' && !prefs.security_enabled) {
      return { allowed: false, reason: 'Security messages are disabled by the user.' }
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
   * Helper to check if current time is within user quiet hours.
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
