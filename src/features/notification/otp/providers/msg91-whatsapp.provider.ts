// ============================================================
// MSG91 WHATSAPP OTP PROVIDER
// ============================================================

import type { IOtpProvider, ProviderResult } from '../interfaces/otp-provider.interface'
import type { OtpChannel } from '../types/otp.types'
import { OTP_CONFIG } from '../config/otp.config'

export class Msg91WhatsAppProvider implements IOtpProvider {
  readonly channel: OtpChannel = 'whatsapp'
  readonly providerName = 'msg91-whatsapp'

  async sendOtp(mobile: string, code: string): Promise<ProviderResult> {
    const { authKey, whatsappTemplateName } = OTP_CONFIG.msg91

    if (!authKey) {
      return { success: false, error: 'MSG91 API Auth Key not configured' }
    }
    if (!whatsappTemplateName) {
      return { success: false, error: 'MSG91 WhatsApp Template Name not configured' }
    }

    try {
      // Clean phone number (needs country code with/without + depending on setup, MSG91 prefers without +)
      const cleanMobile = mobile.replace('+', '')

      // MSG91 WhatsApp API payload format
      const payload = {
        to: cleanMobile,
        type: 'template',
        template: {
          name: whatsappTemplateName,
          language: {
            code: OTP_CONFIG.msg91.whatsappTemplateLanguage || 'en',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: code, // Parameter 1: OTP Code
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: code, // CTA autofill parameter if supported by template
                },
              ],
            },
          ],
        },
      }

      const response = await fetch('https://api.msg91.com/api/v5/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify(payload),
      })

      const responseBody = await response.json()

      if (response.ok && (responseBody.status === 'success' || responseBody.type === 'success')) {
        return {
          success: true,
          providerMessageId: responseBody.request_id || 'msg91-whatsapp-success',
        }
      }

      return {
        success: false,
        error: responseBody.message || `MSG91 WhatsApp API Error: ${response.statusText}`,
      }
    } catch (err) {
      console.error('[Msg91WhatsAppProvider] Failed to send WhatsApp OTP:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown network failure',
      }
    }
  }
}
