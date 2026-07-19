'use server'

// ============================================================
// NOTIFICATION PREFERENCES SERVER ACTIONS
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { NotificationPreferenceService } from '../services/preferences.service'
import type { UserPreferencesData, OtpMethod, DigestTimeOption } from '../types/preferences.types'

const service = new NotificationPreferenceService()

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Unauthorized access. User session not found.')
  }
  return user.id
}

/**
 * Server Action: Fetches active preferences for the logged-in user.
 */
export async function getPreferences() {
  try {
    const userId = await getAuthenticatedUserId()
    const data = await service.getPreferences(userId)
    return { success: true, data }
  } catch (err) {
    console.error('[getPreferences Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unauthorized.' }
  }
}

/**
 * Server Action: Updates user preference toggles.
 */
export async function updatePreferences(updates: Partial<UserPreferencesData>) {
  try {
    const userId = await getAuthenticatedUserId()
    const res = await service.updatePreferences(userId, updates)
    return {
      success: res.success,
      data: res.data,
      error: res.error,
    }
  } catch (err) {
    console.error('[updatePreferences Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unauthorized.' }
  }
}

/**
 * Server Action: Resets choices back to defaults.
 */
export async function resetPreferences() {
  try {
    const userId = await getAuthenticatedUserId()
    const data = await service.resetPreferences(userId)
    return { success: !!data, data }
  } catch (err) {
    console.error('[resetPreferences Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unauthorized.' }
  }
}

/**
 * Server Action: Helper action specifically updating OTP preference.
 */
export async function updateOTPPreference(method: OtpMethod, autoFallback: boolean) {
  try {
    const userId = await getAuthenticatedUserId()
    const updates: Partial<UserPreferencesData> = {
      otpPreference: method,
      autoFallback,
    }

    // Automatically align SMS/WhatsApp enable flags if they are currently off
    if (method === 'whatsapp') {
      updates.whatsappEnabled = true
    } else if (method === 'sms') {
      updates.smsEnabled = true
    }

    const res = await service.updatePreferences(userId, updates)
    return { success: res.success, data: res.data, error: res.error }
  } catch (err) {
    console.error('[updateOTPPreference Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unauthorized.' }
  }
}

/**
 * Server Action: Helper action specifically updating Quiet Hours.
 */
export async function updateQuietHours(
  enabled: boolean,
  start: string | null,
  end: string | null,
  timezone: string
) {
  try {
    const userId = await getAuthenticatedUserId()
    const updates: Partial<UserPreferencesData> = {
      quietHoursStart: enabled ? start : null,
      quietHoursEnd: enabled ? end : null,
      timezone,
    }

    const res = await service.updatePreferences(userId, updates)
    return { success: res.success, data: res.data, error: res.error }
  } catch (err) {
    console.error('[updateQuietHours Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unauthorized.' }
  }
}

/**
 * Server Action: Helper action specifically updating Digest Delivery hours.
 */
export async function updateDigestSettings(
  dailyTime: DigestTimeOption,
  dailyCustomTime: string,
  weeklyDays: string[],
  weeklyCustomTime: string
) {
  try {
    const userId = await getAuthenticatedUserId()
    const current = await service.getPreferences(userId)

    const updates: Partial<UserPreferencesData> = {
      digest: {
        dailyTime,
        dailyCustomTime,
        weeklyDays,
        weeklyCustomTime,
      },
    }

    const res = await service.updatePreferences(userId, updates)
    return { success: res.success, data: res.data, error: res.error }
  } catch (err) {
    console.error('[updateDigestSettings Server Action] Failure:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unauthorized.' }
  }
}
