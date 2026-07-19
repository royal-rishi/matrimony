// ============================================================
// SMS CONFIGURATION
// ============================================================

export const SMS_CONFIG = {
  // DLT-approved Sender ID for India (must be exactly 6 characters)
  defaultSenderId: process.env.MSG91_SMS_SENDER_ID || 'RSTJDO',

  // Default route (4 = transactional in MSG91)
  defaultRoute: process.env.MSG91_SMS_ROUTE || '4',

  // Characters per SMS segment (standard GSM-7 encoding vs Unicode)
  limits: {
    gsm7SegmentLength: 160,
    unicodeSegmentLength: 70,
    gsm7ConcatSegmentLength: 153,
    unicodeConcatSegmentLength: 67,
    maxSegments: 10, // maximum concatenated SMS count
  },

  // Default language fallback
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'hi'],
} as const
