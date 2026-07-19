'use server'

// ============================================================
// OTP SERVER ACTIONS
// ============================================================

import { headers } from 'next/headers'
import { createOtpService } from '../services/otp-service.factory'
import type { OtpPurpose, OtpChannel } from '../types/otp.types'
import { createClient } from '@/lib/supabase/server'
import type { OtpPreference } from '../types/otp-database.types'

/**
 * Utility helper to retrieve the client IP address and device fingerprint hash.
 */
async function getClientMetadata() {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  const userAgent = headersList.get('user-agent') || 'unknown'
  
  // Combine IP and user-agent for a simple fingerprint
  const fingerprint = Buffer.from(`${ip}-${userAgent}`).toString('base64').slice(0, 64)
  
  return { ip, fingerprint }
}

/**
 * Action: Sends an OTP to the given mobile number.
 */
export async function sendOTP(
  mobile: string,
  purpose: OtpPurpose,
  channel?: OtpChannel
) {
  try {
    const { ip, fingerprint } = await getClientMetadata()
    
    // Resolve logged in user ID if any
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const service = createOtpService()
    const result = await service.sendOtp({
      mobile,
      purpose,
      channel,
      userId: user?.id,
      ipAddress: ip,
      deviceFingerprint: fingerprint,
    })

    return {
      success: result.success,
      channelUsed: result.channelUsed,
      expiresAt: result.expiresAt.toISOString(),
      cooldownRemaining: result.cooldownRemaining,
      error: result.error,
    }
  } catch (err) {
    console.error('[sendOTP Action] Execution failure:', err)
    return {
      success: false,
      channelUsed: 'whatsapp' as const,
      expiresAt: new Date().toISOString(),
      error: 'An internal error occurred. Please try again.',
    }
  }
}

/**
 * Action: Verifies a code against an active OTP request.
 */
export async function verifyOTP(
  mobile: string,
  code: string,
  purpose: OtpPurpose
) {
  try {
    const { ip, fingerprint } = await getClientMetadata()
    const service = createOtpService()
    
    const result = await service.verifyOtp({
      mobile,
      code,
      purpose,
      ipAddress: ip,
      deviceFingerprint: fingerprint,
    })

    return {
      success: result.success,
      verified: result.verified,
      attemptsRemaining: result.attemptsRemaining,
      error: result.error,
      errorCode: result.errorCode,
    }
  } catch (err) {
    console.error('[verifyOTP Action] Execution failure:', err)
    return {
      success: false,
      verified: false,
      attemptsRemaining: 0,
      error: 'An internal error occurred during verification.',
    }
  }
}

/**
 * Action: Resends a code by cancelling the active request and sending a new one.
 */
export async function resendOTP(mobile: string, purpose: OtpPurpose) {
  try {
    const { ip, fingerprint } = await getClientMetadata()
    const service = createOtpService()
    
    const result = await service.resendOtp({
      mobile,
      purpose,
      ipAddress: ip,
      deviceFingerprint: fingerprint,
    })

    return {
      success: result.success,
      channelUsed: result.channelUsed,
      expiresAt: result.expiresAt.toISOString(),
      cooldownRemaining: result.cooldownRemaining,
      error: result.error,
    }
  } catch (err) {
    console.error('[resendOTP Action] Execution failure:', err)
    return {
      success: false,
      channelUsed: 'whatsapp' as const,
      expiresAt: new Date().toISOString(),
      error: 'Failed to resend verification code.',
    }
  }
}

/**
 * Action: Cancels an active OTP request immediately (e.g. user aborts flow).
 */
export async function cancelOTP(mobile: string, purpose: OtpPurpose) {
  try {
    const service = createOtpService()
    await service.cancelOtp({ mobile, purpose })
    return { success: true }
  } catch (err) {
    console.error('[cancelOTP Action] Execution failure:', err)
    return { success: false, error: 'Failed to cancel verification code.' }
  }
}

/**
 * Action: Changes the user's OTP preference channel (sms, whatsapp, email) in notification preferences.
 */
export async function changeOTPPreference(preference: OtpPreference) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Unauthorized.' }
    }

    const { error: updateError } = await supabase
      .from('notification_preferences')
      .update({ otp_preference: preference })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('[changeOTPPreference Action] Database update failure:', updateError)
      return { success: false, error: 'Failed to update OTP preference settings.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[changeOTPPreference Action] Execution failure:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}
