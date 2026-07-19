// ============================================================
// OTP SERVICE STUB — Phase 2
// Defines the OTP interface and types.
// Implementation will use MSG91 OTP API in Phase 2.
// ============================================================

// ---- OTP Types ----

export type OtpPurpose =
  | 'phone_verification'
  | 'login'
  | 'password_reset'
  | 'transaction_confirmation'

export interface SendOtpInput {
  userId: string
  phone: string          // E.164 format: +91XXXXXXXXXX
  purpose: OtpPurpose
}

export interface VerifyOtpInput {
  userId: string
  phone: string
  otp: string
  purpose: OtpPurpose
}

export interface OtpResult {
  success: boolean
  requestId?: string    // MSG91 request_id for tracking
  expiresAt?: string    // ISO timestamp
  error?: string
}

export interface OtpVerificationResult {
  success: boolean
  verified: boolean
  error?: string
}

// ---- OTP Provider Interface ----

export interface IOtpProvider {
  /** Send an OTP to the given phone number */
  sendOtp(input: SendOtpInput): Promise<OtpResult>
  /** Verify an OTP code entered by the user */
  verifyOtp(input: VerifyOtpInput): Promise<OtpVerificationResult>
}

// ---- Phase 2 Stub ----

export class OtpServiceStub implements IOtpProvider {
  async sendOtp(_input: SendOtpInput): Promise<OtpResult> {
    // TODO [Phase 2]: Integrate MSG91 OTP API
    // POST https://api.msg91.com/api/v5/otp
    // with authkey, mobile, template_id, otp (auto-generated)
    console.warn('[OtpService] Phase 2 not yet implemented.')
    return {
      success: false,
      error: 'OTP service not yet implemented (Phase 2)',
    }
  }

  async verifyOtp(_input: VerifyOtpInput): Promise<OtpVerificationResult> {
    // TODO [Phase 2]: Integrate MSG91 OTP Verify API
    // GET https://api.msg91.com/api/v5/otp/verify
    console.warn('[OtpService] Phase 2 not yet implemented.')
    return {
      success: false,
      verified: false,
      error: 'OTP verification not yet implemented (Phase 2)',
    }
  }
}
