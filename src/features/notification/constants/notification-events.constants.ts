// ============================================================
// NOTIFICATION EVENT CONSTANTS
// Enum-like const objects for all notification event types.
// Using const objects instead of TypeScript enums for better
// tree-shaking and runtime interoperability.
// ============================================================

// ---- Matrimonial / User Events ----
export const MATCH_EVENTS = {
  INTEREST_RECEIVED:    'match.interest_received',
  INTEREST_ACCEPTED:    'match.interest_accepted',
  INTEREST_REJECTED:    'match.interest_rejected',
  MATCH_CONNECTED:      'match.connected',
  PROFILE_VIEWED:       'match.profile_viewed',
  SHORTLISTED:          'match.shortlisted',
  PROFILE_LIKED:        'match.profile_liked',
} as const

export const CHAT_EVENTS = {
  NEW_MESSAGE:          'chat.new_message',
  MESSAGE_READ:         'chat.message_read',
  CHAT_REQUEST:         'chat.request',
  CHAT_REQUEST_ACCEPTED:'chat.request_accepted',
} as const

export const PROFILE_EVENTS = {
  PROFILE_VERIFIED:     'profile.verified',
  PROFILE_REJECTED:     'profile.rejected',
  PROFILE_INCOMPLETE:   'profile.incomplete',
  PHOTO_APPROVED:       'profile.photo_approved',
  PHOTO_REJECTED:       'profile.photo_rejected',
  KYC_REJECTED:         'profile.kyc_rejected',
} as const

// ---- Subscription & Payment Events ----
export const PAYMENT_EVENTS = {
  SUBSCRIPTION_STARTED:  'payment.subscription_started',
  SUBSCRIPTION_RENEWED:  'payment.subscription_renewed',
  SUBSCRIPTION_EXPIRING: 'payment.subscription_expiring',
  SUBSCRIPTION_EXPIRED:  'payment.subscription_expired',
  PAYMENT_FAILED:        'payment.payment_failed',
  PAYMENT_REFUNDED:      'payment.payment_refunded',
  PAYMENT_SUCCESS:       'payment.payment_success',
  MEMBERSHIP_ACTIVATED:  'payment.membership_activated',
  REFUND_SUCCESS:        'payment.refund_success',
} as const

// ---- Associate / CRM Events ----
export const ASSOCIATE_EVENTS = {
  NEW_ASSIGNMENT:        'associate.new_assignment',
  CASE_UPDATED:          'associate.case_updated',
  MEETING_SCHEDULED:     'associate.meeting_scheduled',
  COMMISSION_RELEASED:   'associate.commission_released',
  REVIEW_RECEIVED:       'associate.review_received',
  MARRIAGE_COMPLETED:    'associate.marriage_completed',
  DISPUTE_OPENED:        'associate.dispute_opened',
  WITHDRAWAL_APPROVED:   'associate.withdrawal_approved',
  WITHDRAWAL_REJECTED:   'associate.withdrawal_rejected',
  REMINDER_DUE:          'associate.reminder_due',
  ASSOCIATE_ASSIGNED:    'associate.assigned',
  ASSOCIATE_PLAN_ACTIVATED: 'associate.plan_activated',
  MEETING_REMINDER:      'associate.meeting_reminder',
  ASSOCIATE_CASE_CLOSED: 'associate.case_closed',
  COMMISSION_CREDITED:   'associate.commission_credited',
} as const

// ---- Admin / System Events ----
export const SYSTEM_EVENTS = {
  SYSTEM_ANNOUNCEMENT:   'system.announcement',
  MAINTENANCE_NOTICE:    'system.maintenance',
  FRAUD_ALERT:           'system.fraud_alert',
  KYC_REQUIRED:          'system.kyc_required',
  ACCOUNT_SUSPENDED:     'system.account_suspended',
  ACCOUNT_RESTORED:      'system.account_restored',
  NEW_SUPPORT_REPLY:     'system.support_reply',
  NEW_DEVICE_LOGIN:      'system.new_device_login',
  EMAIL_CHANGED:         'system.email_changed',
  MOBILE_CHANGED:         'system.mobile_changed',
  SECURITY_ALERT:        'system.security_alert',
} as const

// ---- OTP Events (Phase 2 stubs — APIs not connected yet) ----
export const OTP_EVENTS = {
  OTP_REQUESTED:         'otp.requested',
  OTP_VERIFIED:          'otp.verified',
  OTP_FAILED:            'otp.failed',
} as const

// ---- Aggregated lookup map ----
export const ALL_NOTIFICATION_EVENTS = {
  ...MATCH_EVENTS,
  ...CHAT_EVENTS,
  ...PROFILE_EVENTS,
  ...PAYMENT_EVENTS,
  ...ASSOCIATE_EVENTS,
  ...SYSTEM_EVENTS,
  ...OTP_EVENTS,
} as const

/** Union type of every valid event type string */
export type NotificationEventType =
  typeof ALL_NOTIFICATION_EVENTS[keyof typeof ALL_NOTIFICATION_EVENTS]
