// ============================================================
// NOTIFICATION PREFERENCES CONFIGURATION
// ============================================================

export const PREFERENCES_CONFIG = {
  supportedLanguages: [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
  ],

  supportedTimezones: [
    { code: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { code: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    { code: 'America/New_York', label: 'Eastern Standard Time (EST)' },
    { code: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  ],

  // System locked alerts that can never be disabled by the user
  lockedSecurityAlerts: [
    'auth.register_otp',
    'auth.login_otp',
    'auth.forgot_password_otp',
    'auth.change_mobile_otp',
    'system.security_alert',
    'system.fraud_alert',
    'system.account_suspended',
  ],

  // Factory default settings for a new user
  defaultPreferences: {
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    whatsappEnabled: false,
    
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'Asia/Kolkata',
    language: 'en',
    
    otpPreference: 'sms' as const,
    autoFallback: true,
    
    // Privacy defaults
    privacy: {
      hideProfileViewed: false,
      hideMatchRecommendations: false,
      receiveAnonymousVisitor: true,
    },

    // Daily & weekly digest schedules
    digest: {
      dailyTime: 'morning' as const, // morning | afternoon | evening | custom
      dailyCustomTime: '09:00',
      weeklyDays: ['Friday'] as string[],
      weeklyCustomTime: '18:00',
    },

    // Detailed categories toggles
    categories: {
      email: {
        authentication: true,
        payment: true,
        verification: true,
        associate: true,
        security: true,
        support: true,
        marketing: true,
        blog: false,
        newsletter: true,
        matchDigest: true,
        weeklyDigest: true,
      },
      sms: {
        payment: true,
        verification: true,
        security: true,
        associate: true,
        meetingReminder: true,
      },
      whatsapp: {
        otp: true,
        payment: true,
        associate: true,
        meeting: true,
        support: true,
        marketing: false,
      },
    },
  },
}
export type DefaultPreferences = typeof PREFERENCES_CONFIG.defaultPreferences
export type ChannelCategories = typeof PREFERENCES_CONFIG.defaultPreferences.categories
