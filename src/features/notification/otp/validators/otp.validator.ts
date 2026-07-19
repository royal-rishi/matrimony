// ============================================================
// OTP VALIDATOR SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { SECURITY_CONFIG } from '../config/security.config'

export class OTPValidator {
  /**
   * Validates if a phone number complies with E.164 formatting standards.
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{7,14}$/
    return phoneRegex.test(phone)
  }

  /**
   * Validates if a code is exactly 6 digits.
   */
  isValidOtpCode(code: string): boolean {
    const codeRegex = /^\d{6}$/
    return codeRegex.test(code)
  }

  /**
   * Checks if the mobile, IP, or device is currently blocked in the database.
   */
  async checkBlocks(
    mobile: string,
    ipAddress: string,
    deviceFingerprint?: string
  ): Promise<{ blocked: boolean; reason?: string; blockedUntil?: Date }> {
    const supabase = await createClient()
    const now = new Date().toISOString()

    const targets = [mobile, ipAddress]
    if (deviceFingerprint) {
      targets.push(deviceFingerprint)
    }

    const { data: blocks, error } = await supabase
      .from('otp_blocks')
      .select('block_type, blocked_until')
      .in('target', targets)
      .gt('blocked_until', now)

    if (error) {
      console.error('[OTPValidator] Error checking blocks:', error)
      return { blocked: false }
    }

    if (blocks && blocks.length > 0) {
      // Find the furthest blocked_until date
      const primaryBlock = blocks.reduce((max: any, b: any) => 
        new Date(b.blocked_until) > new Date(max.blocked_until) ? b : max
      )
      
      return {
        blocked: true,
        reason: primaryBlock.block_type,
        blockedUntil: new Date(primaryBlock.blocked_until)
      }
    }

    return { blocked: false }
  }

  /**
   * Validates rate limits: Cooldown (30s) and Daily limits (10 OTPs).
   */
  async checkRateLimits(
    mobile: string,
    ipAddress: string,
    deviceFingerprint?: string
  ): Promise<{ allowed: boolean; error?: string; cooldownRemaining?: number }> {
    const supabase = await createClient()
    const now = new Date()

    // 1. Cooldown Check (30 seconds)
    const { data: latestRequest } = await supabase
      .from('otp_requests')
      .select('created_at')
      .eq('mobile', mobile)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestRequest) {
      const lastCreated = new Date(latestRequest.created_at)
      const diffSeconds = Math.floor((now.getTime() - lastCreated.getTime()) / 1000)
      const cooldownPeriod = 30 // Cooldown from configuration

      if (diffSeconds < cooldownPeriod) {
        return {
          allowed: false,
          error: 'Please wait before requesting another OTP.',
          cooldownRemaining: cooldownPeriod - diffSeconds,
        }
      }
    }

    // 2. Daily limits check (10 OTPs per mobile per 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const { count: dailyCount } = await supabase
      .from('otp_requests')
      .select('*', { count: 'exact', head: true })
      .eq('mobile', mobile)
      .gt('created_at', oneDayAgo)

    if (dailyCount !== null && dailyCount >= SECURITY_CONFIG.maxDailyOtp) {
      // Auto-apply daily block
      await this.applyBlock(mobile, 'daily_limit', SECURITY_CONFIG.blockDurations.dailyLimit)
      return {
        allowed: false,
        error: 'Daily limit exceeded. This number has been temporarily blocked for 24 hours.',
      }
    }

    // 3. Rapid requests count check (per IP/device to prevent spam engines)
    const rapidRequestWindowStart = new Date(now.getTime() - SECURITY_CONFIG.rapidRequestWindow * 1000).toISOString()
    
    // Check per IP
    const { count: ipCount } = await supabase
      .from('otp_requests')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ipAddress)
      .gt('created_at', rapidRequestWindowStart)

    if (ipCount !== null && ipCount >= SECURITY_CONFIG.rapidRequestLimit) {
      await this.applyBlock(ipAddress, 'rapid_requests', SECURITY_CONFIG.blockDurations.rapidRequests)
      return {
        allowed: false,
        error: 'Too many requests. IP blocked temporarily.',
      }
    }

    // Check per Device if fingerprint is provided
    if (deviceFingerprint) {
      const { count: deviceCount } = await supabase
        .from('otp_requests')
        .select('*', { count: 'exact', head: true })
        .eq('device_fingerprint', deviceFingerprint)
        .gt('created_at', rapidRequestWindowStart)

      if (deviceCount !== null && deviceCount >= SECURITY_CONFIG.rapidRequestLimit) {
        await this.applyBlock(deviceFingerprint, 'rapid_requests', SECURITY_CONFIG.blockDurations.rapidRequests)
        return {
          allowed: false,
          error: 'Too many requests from this device. Access blocked temporarily.',
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Applies an automated security block.
   */
  async applyBlock(
    target: string,
    blockType: 'brute_force' | 'rapid_requests' | 'daily_limit',
    durationSeconds: number
  ): Promise<void> {
    const supabase = await createClient()
    const blockedUntil = new Date(Date.now() + durationSeconds * 1000).toISOString()

    const { error } = await supabase
      .from('otp_blocks')
      .insert({
        target,
        block_type: blockType,
        blocked_until: blockedUntil,
      })

    if (error) {
      console.error('[OTPValidator] Error applying block:', error)
    }
  }
}
