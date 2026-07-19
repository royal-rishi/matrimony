// ============================================================
// OTP MODULE TYPES
// ============================================================

export type OtpPurpose =
  | 'phone_verification'
  | 'login'
  | 'password_reset'
  | 'change_mobile'
  | 'delete_account'

export type OtpChannel = 'sms' | 'whatsapp'

export interface SendOtpInput {
  mobile: string               // E.164 format: +91XXXXXXXXXX
  purpose: OtpPurpose
  channel?: OtpChannel
  userId?: string              // Optional, matches logged-in user
  ipAddress: string
  deviceFingerprint?: string
}

export interface VerifyOtpInput {
  mobile: string
  code: string                 // 6-digit verification code
  purpose: OtpPurpose
  ipAddress: string
  deviceFingerprint?: string
}

export interface OtpSendResult {
  success: boolean
  requestId?: string           // Database request ID or Provider ID
  channelUsed: OtpChannel
  expiresAt: Date
  cooldownRemaining?: number   // seconds
  error?: string
  errorCode?: string
}

export interface OtpVerificationResult {
  success: boolean
  verified: boolean
  attemptsRemaining: number
  error?: string
  errorCode?: string
}

export interface ResendOtpInput {
  mobile: string
  purpose: OtpPurpose
  ipAddress: string
  deviceFingerprint?: string
}

export interface CancelOtpInput {
  mobile: string
  purpose: OtpPurpose
}

export interface OtpRequestRow {
  id: string
  mobile: string
  user_id: string | null
  hashed_code: string
  purpose: OtpPurpose
  channel: OtpChannel
  attempts: number
  ip_address: string
  device_fingerprint: string | null
  expires_at: string
  verified_at: string | null
  created_at: string
}

export interface OtpBlockRow {
  id: string
  target: string
  block_type: 'brute_force' | 'rapid_requests' | 'daily_limit'
  blocked_until: string
  created_at: string
}
