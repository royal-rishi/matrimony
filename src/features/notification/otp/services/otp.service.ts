// ============================================================
// OTP SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { OTP_CONFIG } from '../config/otp.config'
import { SECURITY_CONFIG } from '../config/security.config'
import type { IOtpProvider } from '../interfaces/otp-provider.interface'
import { FallbackResolver } from './fallback-resolver'
import { OTPValidator } from '../validators/otp.validator'
import { OTPLogger } from '../utils/otp.logger'
import { OTPAnalytics } from '../utils/otp.analytics'
import type {
  SendOtpInput,
  VerifyOtpInput,
  OtpSendResult,
  OtpVerificationResult,
  ResendOtpInput,
  CancelOtpInput,
} from '../types/otp.types'

export class OTPService {
  private readonly fallbackResolver: FallbackResolver
  private readonly validator: OTPValidator

  constructor(private readonly providers: IOtpProvider[]) {
    this.fallbackResolver = new FallbackResolver(providers)
    this.validator = new OTPValidator()
  }

  /**
   * Helper to hash an OTP code with SHA-256 (no plaintext stored).
   */
  private hashOtp(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex')
  }

  /**
   * Helper to generate a 6-digit random code.
   */
  private generateRandomCode(): string {
    const chars = OTP_CONFIG.characters
    let code = ''
    for (let i = 0; i < OTP_CONFIG.length; i++) {
      const idx = crypto.randomInt(0, chars.length)
      code += chars[idx]
    }
    return code
  }

  // ============================================================
  // sendOtp
  // ============================================================
  async sendOtp(input: SendOtpInput): Promise<OtpSendResult> {
    // 1. Syntax check
    if (!this.validator.isValidPhoneNumber(input.mobile)) {
      return { success: false, channelUsed: 'whatsapp', expiresAt: new Date(), error: 'Invalid phone number format. Must be E.164 (e.g. +91XXXXXXXXXX)' }
    }

    // 2. Abuse check (locks)
    const blockCheck = await this.validator.checkBlocks(
      input.mobile,
      input.ipAddress,
      input.deviceFingerprint
    )
    if (blockCheck.blocked) {
      return {
        success: false,
        channelUsed: 'whatsapp',
        expiresAt: new Date(),
        error: `Authentication blocked due to: ${blockCheck.reason}. Block active until ${blockCheck.blockedUntil?.toLocaleTimeString()}`,
      }
    }

    // 3. Rate Limit check (cooldown & daily limits)
    const rateCheck = await this.validator.checkRateLimits(
      input.mobile,
      input.ipAddress,
      input.deviceFingerprint
    )
    if (!rateCheck.allowed) {
      return {
        success: false,
        channelUsed: 'whatsapp',
        expiresAt: new Date(),
        error: rateCheck.error,
        cooldownRemaining: rateCheck.cooldownRemaining,
      }
    }

    // 4. Generate & Hash Code
    const rawCode = this.generateRandomCode()
    const hashedCode = this.hashOtp(rawCode)
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expirySeconds * 1000)

    // 5. Send with Fallback
    const dispatch = await this.fallbackResolver.sendWithFallback(
      input.mobile,
      rawCode,
      input.channel
    )

    if (!dispatch.success) {
      await OTPLogger.logAction({
        mobile: input.mobile,
        purpose: input.purpose,
        channel: dispatch.channelUsed,
        status: 'failed',
        provider: dispatch.providerName,
        errorMessage: dispatch.error,
      })
      await OTPAnalytics.trackMetric(dispatch.channelUsed, dispatch.providerName, 'failed')

      return {
        success: false,
        channelUsed: dispatch.channelUsed,
        expiresAt: new Date(),
        error: dispatch.error || 'Provider dispatch failed.',
      }
    }

    // 6. Persist hashed code to db
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('otp_requests')
      .insert({
        mobile: input.mobile,
        user_id: input.userId || null,
        hashed_code: hashedCode,
        purpose: input.purpose,
        channel: dispatch.channelUsed,
        attempts: 0,
        ip_address: input.ipAddress,
        device_fingerprint: input.deviceFingerprint || null,
        expires_at: expiresAt.toISOString(),
      })

    if (dbError) {
      console.error('[OTPService] Failed to insert OTP request:', dbError)
      return {
        success: false,
        channelUsed: dispatch.channelUsed,
        expiresAt: new Date(),
        error: 'Failed to record OTP security request.',
      }
    }

    // 7. Audit Logging
    await OTPLogger.logAction({
      mobile: input.mobile,
      purpose: input.purpose,
      channel: dispatch.channelUsed,
      status: 'sent',
      provider: dispatch.providerName,
      requestPayload: { channelRequested: input.channel },
      responsePayload: { providerMessageId: dispatch.providerMessageId },
    })
    await OTPAnalytics.trackMetric(dispatch.channelUsed, dispatch.providerName, 'sent')

    return {
      success: true,
      requestId: dispatch.providerMessageId,
      channelUsed: dispatch.channelUsed,
      expiresAt,
      cooldownRemaining: OTP_CONFIG.cooldownSeconds,
    }
  }

  // ============================================================
  // verifyOtp
  // ============================================================
  async verifyOtp(input: VerifyOtpInput): Promise<OtpVerificationResult> {
    // 1. Syntax check
    if (!this.validator.isValidPhoneNumber(input.mobile)) {
      return { success: false, verified: false, attemptsRemaining: 0, error: 'Invalid phone format' }
    }
    if (!this.validator.isValidOtpCode(input.code)) {
      return { success: false, verified: false, attemptsRemaining: 0, error: 'Invalid code format. Must be 6 digits' }
    }

    // 2. Block check
    const blockCheck = await this.validator.checkBlocks(
      input.mobile,
      input.ipAddress,
      input.deviceFingerprint
    )
    if (blockCheck.blocked) {
      return {
        success: false,
        verified: false,
        attemptsRemaining: 0,
        error: `Verification blocked. Block active until ${blockCheck.blockedUntil?.toLocaleTimeString()}`,
      }
    }

    const supabase = await createClient()
    const now = new Date().toISOString()

    // 3. Find active unexpired request
    const { data: request, error: fetchError } = await supabase
      .from('otp_requests')
      .select('*')
      .eq('mobile', input.mobile)
      .eq('purpose', input.purpose)
      .is('verified_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError || !request) {
      return {
        success: false,
        verified: false,
        attemptsRemaining: 0,
        error: 'OTP code has expired or is invalid. Please request a new code.',
      }
    }

    const hashedInput = this.hashOtp(input.code)

    // 4. Code check
    if (request.hashed_code === hashedInput) {
      // Success! Expire instantly by setting verified_at to now
      await supabase
        .from('otp_requests')
        .update({ verified_at: now })
        .eq('id', request.id)

      await OTPLogger.logAction({
        mobile: input.mobile,
        purpose: input.purpose,
        channel: request.channel,
        status: 'delivered',
        provider: 'database-verify',
      })
      await OTPAnalytics.trackMetric(request.channel, 'database-verify', 'delivered')

      return {
        success: true,
        verified: true,
        attemptsRemaining: 0,
      }
    }

    // 5. Code mismatch -> Increment attempts
    const newAttempts = request.attempts + 1
    const attemptsRemaining = SECURITY_CONFIG.maxAttempts - newAttempts

    if (newAttempts >= SECURITY_CONFIG.maxAttempts) {
      // Brute-force detected: mark code as expired and lock target
      await supabase
        .from('otp_requests')
        .update({
          attempts: newAttempts,
          expires_at: now, // expire request immediately
        })
        .eq('id', request.id)

      // Lock mobile, IP and device
      await this.validator.applyBlock(input.mobile, 'brute_force', SECURITY_CONFIG.blockDurations.bruteForce)
      await this.validator.applyBlock(input.ipAddress, 'brute_force', SECURITY_CONFIG.blockDurations.bruteForce)
      if (input.deviceFingerprint) {
        await this.validator.applyBlock(input.deviceFingerprint, 'brute_force', SECURITY_CONFIG.blockDurations.bruteForce)
      }

      await OTPLogger.logAction({
        mobile: input.mobile,
        purpose: input.purpose,
        channel: request.channel,
        status: 'failed',
        provider: 'database-verify',
        errorMessage: 'Brute force block triggered. Max attempts reached.',
        errorCode: 'BRUTE_FORCE',
        retryCount: newAttempts,
      })

      return {
        success: false,
        verified: false,
        attemptsRemaining: 0,
        error: 'Too many incorrect attempts. This target has been locked for 15 minutes.',
        errorCode: 'BLOCKED',
      }
    }

    // Normal attempt increment
    await supabase
      .from('otp_requests')
      .update({ attempts: newAttempts })
      .eq('id', request.id)

    return {
      success: false,
      verified: false,
      attemptsRemaining,
      error: `Incorrect code. ${attemptsRemaining} attempts remaining.`,
      errorCode: 'INVALID_CODE',
    }
  }

  // ============================================================
  // resendOtp
  // ============================================================
  async resendOtp(input: ResendOtpInput): Promise<OtpSendResult> {
    const supabase = await createClient()

    // 1. Cancel previous requests for this purpose to prevent replay attacks
    await supabase
      .from('otp_requests')
      .update({ expires_at: new Date().toISOString() })
      .eq('mobile', input.mobile)
      .eq('purpose', input.purpose)
      .is('verified_at', null)

    // 2. Issue new OTP
    return this.sendOtp({
      mobile: input.mobile,
      purpose: input.purpose,
      ipAddress: input.ipAddress,
      deviceFingerprint: input.deviceFingerprint,
    })
  }

  // ============================================================
  // cancelOtp
  // ============================================================
  async cancelOtp(input: CancelOtpInput): Promise<void> {
    const supabase = await createClient()
    // Instantly expire active OTP requests
    await supabase
      .from('otp_requests')
      .update({ expires_at: new Date().toISOString() })
      .eq('mobile', input.mobile)
      .eq('purpose', input.purpose)
      .is('verified_at', null)
  }
}
