// ============================================================
// MOCK SMS PROVIDER (For development and testing)
// ============================================================

import type { ISmsProvider } from '../interfaces/sms-provider.interface'
import type { SmsPayload, SmsProviderResult, SmsDeliveryStatus } from '../types/sms.types'

export class MockSmsProvider implements ISmsProvider {
  readonly providerId = 'mock-sms'
  readonly displayName = 'Mock SMS Provider'

  private shouldFailNext = false
  private failReason = 'Mock Provider network failure simulation.'

  /** Enables simulation of provider failure for test coverage */
  setFailureMode(fail: boolean, reason?: string) {
    this.shouldFailNext = fail
    if (reason) this.failReason = reason
  }

  async sendSms(payload: SmsPayload): Promise<SmsProviderResult> {
    if (this.shouldFailNext) {
      console.log(`[MockSmsProvider] Simulating failure sending SMS to ${payload.toPhone}`)
      return {
        success: false,
        error: this.failReason,
        providerResponse: { status: 'failed', code: 'MOCK_FAIL' },
      }
    }

    console.log(
      `[MockSmsProvider] Send SMS to [ ${payload.toPhone} ]\n` +
      `  Sender ID: [ ${payload.senderId || 'RSTJDO'} ]\n` +
      `  DLT Template ID: [ ${payload.dltTemplateId || 'none'} ]\n` +
      `  Body: "${payload.body}"\n` +
      `  Variables: ${JSON.stringify(payload.templateVariables || {})}`
    )

    return {
      success: true,
      providerMessageId: `mock-sms-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      providerResponse: { status: 'sent', provider: 'mock' },
    }
  }

  async getDeliveryStatus(providerMessageId: string): Promise<SmsDeliveryStatus> {
    // 90% chance delivered, otherwise processing
    const rand = Math.random()
    if (rand > 0.1) return 'delivered'
    return 'processing'
  }

  async healthCheck(): Promise<{ isHealthy: boolean; message?: string }> {
    return { isHealthy: true, message: 'Mock provider healthy.' }
  }
}
