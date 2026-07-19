// ============================================================
// OTP AUTHENTICATION CONFIGURATION
// ============================================================

import type { OtpChannel } from '../types/otp.types'

export const OTP_CONFIG = {
  // OTP code format
  length: 6,
  characters: '0123456789',

  // Lifecycles
  expirySeconds: 300,        // 5 minutes
  cooldownSeconds: 30,       // 30 seconds wait before resend

  // Provider Dispatch Configurations
  defaultChannel: 'whatsapp' as OtpChannel, // Default preferred channel
  fallbackEnabled: true,                     // Automatically fallback if primary fails

  // MSG91 Provider Specifics
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || '',
    apiUrl: 'https://control.msg91.com/api/v5/otp',
    smsTemplateId: process.env.MSG91_SMS_OTP_TEMPLATE_ID || '',
    whatsappTemplateName: process.env.MSG91_WHATSAPP_OTP_TEMPLATE_NAME || 'otp_verify',
    whatsappTemplateLanguage: 'en',
  }
}
