// ============================================================
// MOCK WHATSAPP PROVIDER (For development and testing)
// ============================================================

import type { IWhatsAppProvider } from '../interfaces/whatsapp-provider.interface'
import type { WhatsAppPayload, WhatsAppProviderResult, WhatsAppDeliveryStatus } from '../types/whatsapp.types'

export class MockWhatsAppProvider implements IWhatsAppProvider {
  readonly providerId = 'mock-whatsapp'
  readonly displayName = 'Mock WhatsApp Provider'

  private shouldFailNext = false
  private failReason = 'Mock WhatsApp API network error.'
  private forcedStatus: WhatsAppDeliveryStatus = 'sent'

  setFailureMode(fail: boolean, reason?: string) {
    this.shouldFailNext = fail
    if (reason) this.failReason = reason
  }

  setForcedDeliveryStatus(status: WhatsAppDeliveryStatus) {
    this.forcedStatus = status
  }

  async sendWhatsApp(payload: WhatsAppPayload): Promise<WhatsAppProviderResult> {
    if (this.shouldFailNext) {
      console.log(`[MockWhatsAppProvider] Simulating failure sending WhatsApp to ${payload.toPhone}`)
      return {
        success: false,
        error: this.failReason,
        providerResponse: { status: 'failed', code: 'MOCK_FAIL' },
      }
    }

    console.log(
      `[MockWhatsAppProvider] Send WhatsApp to [ ${payload.toPhone} ]\n` +
      `  Template: [ ${payload.templateName} ]\n` +
      `  Language: [ ${payload.language || 'en'} ]\n` +
      `  Variables: ${JSON.stringify(payload.variables || {})}\n` +
      `  Media URL: [ ${payload.mediaUrl || 'none'} ]`
    )

    return {
      success: true,
      providerMessageId: `mock-wa-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      providerResponse: { status: 'sent', provider: 'mock' },
    }
  }

  async getDeliveryStatus(providerMessageId: string): Promise<WhatsAppDeliveryStatus> {
    return this.forcedStatus
  }

  async healthCheck(): Promise<{ isHealthy: boolean; message?: string }> {
    return { isHealthy: true, message: 'Mock WhatsApp provider healthy.' }
  }
}
