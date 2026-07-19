// ============================================================
// OTP FALLBACK RESOLVER
// ============================================================

import type { IOtpProvider, ProviderResult } from '../interfaces/otp-provider.interface'
import type { OtpChannel } from '../types/otp.types'
import { OTP_CONFIG } from '../config/otp.config'

export class FallbackResolver {
  constructor(private readonly providers: IOtpProvider[]) {}

  /**
   * Dispatches OTP using primary channel, falls back to alternative channel on provider failure.
   */
  async sendWithFallback(
    mobile: string,
    code: string,
    requestedChannel?: OtpChannel
  ): Promise<{
    success: boolean
    channelUsed: OtpChannel
    providerName: string
    providerMessageId?: string
    error?: string
  }> {
    const primaryChannel = requestedChannel || OTP_CONFIG.defaultChannel
    const secondaryChannel: OtpChannel = primaryChannel === 'whatsapp' ? 'sms' : 'whatsapp'

    // 1. Try Primary Provider
    const primaryProvider = this.providers.find((p) => p.channel === primaryChannel)
    if (!primaryProvider) {
      return {
        success: false,
        channelUsed: primaryChannel,
        providerName: 'none',
        error: `No provider registered for primary channel: ${primaryChannel}`,
      }
    }

    console.log(`[FallbackResolver] Attempting send via primary: ${primaryProvider.providerName}`)
    const primaryResult = await primaryProvider.sendOtp(mobile, code)

    if (primaryResult.success) {
      return {
        success: true,
        channelUsed: primaryChannel,
        providerName: primaryProvider.providerName,
        providerMessageId: primaryResult.providerMessageId,
      }
    }

    // 2. Cooldown check and Auto Fallback if enabled
    if (!OTP_CONFIG.fallbackEnabled) {
      return {
        success: false,
        channelUsed: primaryChannel,
        providerName: primaryProvider.providerName,
        error: primaryResult.error || 'Primary provider failed and fallback is disabled.',
      }
    }

    console.warn(
      `[FallbackResolver] Primary provider failed: ${primaryResult.error}. Attempting fallback via alternative channel: ${secondaryChannel}`
    )

    // Try Secondary Provider
    const secondaryProvider = this.providers.find((p) => p.channel === secondaryChannel)
    if (!secondaryProvider) {
      return {
        success: false,
        channelUsed: primaryChannel,
        providerName: primaryProvider.providerName,
        error: `Primary failed: ${primaryResult.error}. Fallback unavailable: no provider registered for ${secondaryChannel}`,
      }
    }

    const secondaryResult = await secondaryProvider.sendOtp(mobile, code)

    if (secondaryResult.success) {
      return {
        success: true,
        channelUsed: secondaryChannel,
        providerName: secondaryProvider.providerName,
        providerMessageId: secondaryResult.providerMessageId,
      }
    }

    return {
      success: false,
      channelUsed: secondaryChannel,
      providerName: secondaryProvider.providerName,
      error: `All providers failed. WhatsApp error: ${primaryResult.error}; SMS error: ${secondaryResult.error}`,
    }
  }
}
