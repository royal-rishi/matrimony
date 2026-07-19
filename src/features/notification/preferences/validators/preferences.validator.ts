// ============================================================
// NOTIFICATION PREFERENCE VALIDATOR
// ============================================================

import type { UserPreferencesData } from '../types/preferences.types'
import { PREFERENCES_CONFIG } from '../config/preferences.config'

export class PreferenceValidator {
  /**
   * Validates time zones, quiet hours syntax, and prevents disabling mandatory security warnings.
   */
  static validate(data: Partial<UserPreferencesData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // 1. Validate Timezone
    if (data.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: data.timezone })
      } catch {
        errors.push(`Invalid timezone format: '${data.timezone}'.`)
      }
    }

    // 2. Validate Quiet Hours
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/

    if (data.quietHoursStart && !timeRegex.test(data.quietHoursStart)) {
      errors.push(`Invalid quietHoursStart format: '${data.quietHoursStart}'. Must be HH:MM.`)
    }
    if (data.quietHoursEnd && !timeRegex.test(data.quietHoursEnd)) {
      errors.push(`Invalid quietHoursEnd format: '${data.quietHoursEnd}'. Must be HH:MM.`)
    }

    // 3. Enforce security locks (cannot be disabled)
    if (data.categories) {
      if (data.categories.email?.security === false) {
        errors.push('Security alerts cannot be disabled on the Email channel.')
      }
      if (data.categories.sms?.security === false) {
        errors.push('Security alerts cannot be disabled on the SMS channel.')
      }
      if (data.categories.whatsapp?.otp === false) {
        errors.push('OTP alerts cannot be disabled on the WhatsApp channel.')
      }
    }

    // 4. Resolve conflicts: if WhatsApp is preferred for OTP but WhatsApp is disabled
    if (data.otpPreference === 'whatsapp' && data.whatsappEnabled === false) {
      errors.push('WhatsApp is preferred for OTP, but WhatsApp notifications are disabled.')
    }
    if (data.otpPreference === 'sms' && data.smsEnabled === false) {
      errors.push('SMS is preferred for OTP, but SMS notifications are disabled.')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * Compares current preferences with changes to prevent duplicate database writes.
   */
  static isDuplicateUpdate(current: UserPreferencesData, updates: Partial<UserPreferencesData>): boolean {
    const keys = Object.keys(updates) as (keyof UserPreferencesData)[]
    
    for (const key of keys) {
      if (typeof updates[key] === 'object' && updates[key] !== null) {
        if (JSON.stringify(current[key]) !== JSON.stringify(updates[key])) {
          return false
        }
      } else if (current[key] !== updates[key]) {
        return false
      }
    }
    
    return true
  }
}
