// ============================================================
// PIPELINE RESOLVER (Resolves email, phone, and channel overrides)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { PipelineContext } from '../types/engine.types'
import type { NotificationPreferencesRow } from '../../types/notification-database.types'
import type { NotificationChannel } from '../../interfaces/notification-provider.interface'

export class NotificationResolver {
  /**
   * Resolves the user's email, mobile number, and active communication channel permissions.
   */
  static async resolveUserAndPreferences(context: PipelineContext): Promise<PipelineContext> {
    if (context.isCancelled) return context

    const { userId, eventType } = context.payload
    const supabase = await createClient()

    try {
      // 1. Resolve contact endpoints from profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('email_address, mobile_number')
        .eq('id', userId)
        .maybeSingle()

      if (profileErr || !profile) {
        context.isCancelled = true
        context.cancelReason = `Profile not found for userId: ${userId}`
        context.logs.push('Resolver Stage: FAILED - user profile missing.')
        return context
      }

      context.resolvedEmail = profile.email_address || undefined
      context.resolvedPhone = profile.mobile_number || undefined

      // 2. Fetch user preferences
      const { data: preferences, error: prefErr } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (prefErr || !preferences) {
        // Fall back to only in-app if preferences record is missing
        context.allowedChannels = ['in_app']
        context.logs.push('Resolver Stage: Warning - no preferences, falling back to in_app.')
        return context
      }

      const prefs = preferences as unknown as NotificationPreferencesRow
      const allowed: NotificationChannel[] = ['in_app'] // In-App is always allowed

      // Check category preferences
      const category = NotificationResolver.getEventCategory(eventType)
      let optIn = true

      if (category === 'marketing') optIn = prefs.marketing_enabled
      else if (category === 'payment') optIn = prefs.payment_enabled
      else if (category === 'associate') optIn = prefs.associate_enabled
      else if (category === 'security') optIn = prefs.security_enabled

      if (optIn) {
        if (prefs.email_enabled && context.resolvedEmail) allowed.push('email')
        if (prefs.sms_enabled && context.resolvedPhone) allowed.push('sms')
        if (prefs.whatsapp_enabled && context.resolvedPhone) allowed.push('whatsapp')
        if (prefs.push_enabled) allowed.push('push')
      }

      // Check quiet hours
      const inQuietHours = NotificationResolver.isWithinQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)
      if (inQuietHours) {
        const isCritical = eventType.startsWith('system.security_alert') || eventType.startsWith('system.fraud_alert')
        if (!isCritical) {
          // Temporarily suppress SMS and WhatsApp during quiet hours, but keep Email and In-App
          context.allowedChannels = allowed.filter(c => c !== 'sms' && c !== 'whatsapp')
          context.logs.push('Resolver Stage: Quiet hours active. Filtered SMS and WhatsApp.')
          return context
        }
      }

      context.allowedChannels = allowed
      context.logs.push(`Resolver Stage: Allowed channels resolved -> [ ${allowed.join(', ')} ]`)
    } catch (err) {
      console.error('[NotificationResolver] Failed to resolve preferences:', err)
      context.allowedChannels = ['in_app']
      context.logs.push('Resolver Stage: Error resolving preferences. Defaulted to in_app.')
    }

    return context
  }

  private static getEventCategory(eventType: string): 'marketing' | 'payment' | 'associate' | 'security' | 'transactional' {
    if (eventType.startsWith('marketing.')) return 'marketing'
    if (eventType.startsWith('payment.')) return 'payment'
    if (eventType.startsWith('associate.')) return 'associate'
    if (
      eventType.startsWith('system.security_alert') ||
      eventType.startsWith('system.fraud_alert') ||
      eventType.startsWith('system.new_device_login')
    ) {
      return 'security'
    }
    return 'transactional'
  }

  private static isWithinQuietHours(start: string | null, end: string | null): boolean {
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
