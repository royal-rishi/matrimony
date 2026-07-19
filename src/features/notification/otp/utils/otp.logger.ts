// ============================================================
// OTP LOGGER UTIL
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { OtpChannel, OtpPurpose } from '../types/otp.types'

export class OTPLogger {
  /**
   * Logs an OTP send, verify, or fallback action to the master `notification_logs` table.
   */
  static async logAction(params: {
    mobile: string
    purpose: OtpPurpose
    channel: OtpChannel
    status: 'sent' | 'delivered' | 'failed'
    provider: string
    errorMessage?: string
    errorCode?: string
    requestPayload?: Record<string, unknown>
    responsePayload?: Record<string, unknown>
    retryCount?: number
  }): Promise<void> {
    const supabase = await createClient()

    // Mask phone number for security in logs
    const maskedMobile = params.mobile.slice(0, 3) + '*****' + params.mobile.slice(-4)

    // Build values to insert
    const logData = {
      notification_id: '00000000-0000-0000-0000-000000000000', // OTP dummy notification ID
      user_id: null, // Anonymous or populated during signup
      event: `otp.${params.status === 'sent' ? 'requested' : params.status === 'delivered' ? 'verified' : 'failed'}`,
      channel: params.channel,
      status: params.status === 'sent' ? 'dispatched' : params.status === 'delivered' ? 'delivered' : 'failed',
      provider: params.provider,
      recipient: maskedMobile,
      error_message: params.errorMessage || null,
      error_code: params.errorCode || null,
      request_payload: {
        purpose: params.purpose,
        ...params.requestPayload
      },
      response_payload: params.responsePayload || {},
      retry_count: params.retryCount || 0,
      created_at: new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('notification_logs')
        .insert(logData)

      if (error) {
        console.error('[OTPLogger] Failed to write notification log:', error)
      }
    } catch (err) {
      console.error('[OTPLogger] Log insertion error:', err)
    }
  }
}
