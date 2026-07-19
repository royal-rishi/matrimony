// ============================================================
// NOTIFICATION PREFERENCES DATA TYPES
// ============================================================

export type OtpMethod = 'sms' | 'whatsapp'
export type DigestTimeOption = 'morning' | 'afternoon' | 'evening' | 'custom'

export interface UserPreferencesPrivacy {
  hideProfileViewed: boolean
  hideMatchRecommendations: boolean
  receiveAnonymousVisitor: boolean
}

export interface UserPreferencesDigest {
  dailyTime: DigestTimeOption
  dailyCustomTime: string
  weeklyDays: string[]
  weeklyCustomTime: string
}

export interface UserPreferencesCategories {
  email: {
    authentication: boolean
    payment: boolean
    verification: boolean
    associate: boolean
    security: boolean
    support: boolean
    marketing: boolean
    blog: boolean
    newsletter: boolean
    matchDigest: boolean
    weeklyDigest: boolean
  }
  sms: {
    payment: boolean
    verification: boolean
    security: boolean
    associate: boolean
    meetingReminder: boolean
  }
  whatsapp: {
    otp: boolean
    payment: boolean
    associate: boolean
    meeting: boolean
    support: boolean
    marketing: boolean
  }
}

export interface UserPreferencesData {
  userId: string
  inAppEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  whatsappEnabled: boolean
  
  quietHoursStart: string | null
  quietHoursEnd: string | null
  timezone: string
  language: string
  
  otpPreference: OtpMethod
  autoFallback: boolean
  
  privacy: UserPreferencesPrivacy
  digest: UserPreferencesDigest
  categories: UserPreferencesCategories
}
