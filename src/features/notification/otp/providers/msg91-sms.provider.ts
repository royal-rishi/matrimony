// ============================================================
// MSG91 SMS OTP PROVIDER
// ============================================================

import type { IOtpProvider, ProviderResult } from '../interfaces/otp-provider.interface'
import type { OtpChannel } from '../types/otp.types'
import { OTP_CONFIG } from '../config/otp.config'

export class Msg91SmsProvider implements IOtpProvider {
  readonly channel: OtpChannel = 'sms'
  readonly providerName = 'msg91-sms'

  async sendOtp(mobile: string, code: string): Promise<ProviderResult> {
    const { authKey, apiUrl, smsTemplateId } = OTP_CONFIG.msg91

    if (!authKey) {
      return { success: false, error: 'MSG91 API Auth Key not configured' }
    }
    if (!smsTemplateId) {
      return { success: false, error: 'MSG91 SMS Template ID not configured' }
    }

    try {
      // Clean phone number (strip leading + for MSG91, which expects country code + mobile format without +)
      const cleanMobile = mobile.replace('+', '')

      // Send request using fetch with appropriate headers
      const response = await fetch(`${apiUrl}?template_id=${smsTemplateId}&mobile=${cleanMobile}&authkey=${authKey}&otp=${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const responseBody = await response.json()

      if (response.ok && (responseBody.type === 'success' || responseBody.status === 'success')) {
        return {
          success: true,
          providerMessageId: responseBody.request_id || 'msg91-sms-success',
        }
      }

      return {
        success: false,
        error: responseBody.message || `MSG91 SMS API Error: ${response.statusText}`,
      }
    } catch (err) {
      console.error('[Msg91SmsProvider] Failed to send SMS OTP:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown network failure',
      }
    }
  }
}
