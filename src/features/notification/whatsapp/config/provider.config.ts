// ============================================================
// WHATSAPP PROVIDER CONFIGURATION (MSG91)
// ============================================================

export const PROVIDER_CONFIG = {
  msg91: {
    authKey: process.env.MSG91_WHATSAPP_AUTH_KEY || '',
    apiUrl: process.env.MSG91_WHATSAPP_API_URL || 'https://api.msg91.com/api/v5/whatsapp/send',
    webhookSecret: process.env.MSG91_WHATSAPP_WEBHOOK_SECRET || '',
  }
}
