// ============================================================
// WHATSAPP INFRASTRUCTURE GLOBAL CONFIGURATION
// ============================================================

export const WHATSAPP_CONFIG = {
  senderNumber: process.env.MSG91_WHATSAPP_NUMBER || '+919999999999',
  supportedLanguages: ['en', 'hi'] as const,
  defaultLanguage: 'en' as const,
  
  branding: {
    websiteUrl: 'https://rishtajodo.com',
    profileLinkTemplate: 'https://rishtajodo.com/profile/{{profile_id}}',
  }
}
