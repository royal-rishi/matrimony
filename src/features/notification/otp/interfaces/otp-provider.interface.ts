// ============================================================
// OTP PROVIDER INTERFACE
// ============================================================

import type { OtpChannel } from '../types/otp.types'

export interface ProviderResult {
  success: boolean
  providerMessageId?: string
  error?: string
}

export interface IOtpProvider {
  readonly channel: OtpChannel
  readonly providerName: string
  sendOtp(mobile: string, code: string): Promise<ProviderResult>
}
