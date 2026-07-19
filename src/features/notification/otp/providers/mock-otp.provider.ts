// ============================================================
// MOCK OTP PROVIDER (For development and testing)
// ============================================================

import type { IOtpProvider, ProviderResult } from '../interfaces/otp-provider.interface'
import type { OtpChannel } from '../types/otp.types'

export class MockOtpProvider implements IOtpProvider {
  constructor(
    readonly channel: OtpChannel,
    readonly providerName: string = `mock-${channel}-provider`
  ) {}

  async sendOtp(mobile: string, code: string): Promise<ProviderResult> {
    console.log(
      `[MockOtpProvider:${this.providerName}] Sent OTP Code [ ${code} ] to Mobile [ ${mobile} ] via channel [ ${this.channel} ]`
    )
    return {
      success: true,
      providerMessageId: `mock-msg-${this.channel}-${Date.now()}`,
    }
  }
}
