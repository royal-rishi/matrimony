// ============================================================
// MOCK EMAIL PROVIDER (For development and testing)
// ============================================================

import { EmailProvider } from './email.provider'
import type { EmailPayload, EmailProviderResult, EmailDeliveryStatus } from '../types/email.types'

export class MockEmailProvider extends EmailProvider {
  readonly providerId = 'mock-email'
  readonly displayName = 'Mock Email Provider'

  private shouldFailNext = false
  private failReason = 'Mock provider simulated failure.'
  private forcedStatus: EmailDeliveryStatus = 'sent'

  setFailureMode(fail: boolean, reason?: string) {
    this.shouldFailNext = fail
    if (reason) this.failReason = reason
  }

  setForcedDeliveryStatus(status: EmailDeliveryStatus) {
    this.forcedStatus = status
  }

  async send(payload: EmailPayload): Promise<EmailProviderResult> {
    if (this.shouldFailNext) {
      console.log(`[MockEmailProvider] Simulating failure sending email to ${payload.toEmail}`)
      return {
        success: false,
        error: this.failReason,
        providerResponse: { status: 'failed', statusCode: 500, code: 'MOCK_FAIL' },
      }
    }

    console.log(
      `[MockEmailProvider] Send Email to [ ${payload.toEmail} ]\n` +
      `  Subject: [ ${payload.subject} ]\n` +
      `  Sender: [ ${payload.fromName || 'RishtaJodo'} <${payload.fromEmail || 'noreply@rishtajodo.com'}> ]\n` +
      `  Attachments count: ${payload.attachments?.length || 0}`
    )

    return {
      success: true,
      providerMessageId: `mock-email-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      providerResponse: { status: 'sent', provider: 'mock', statusCode: 200 },
    }
  }

  async schedule(payload: EmailPayload, scheduleTime: Date): Promise<EmailProviderResult> {
    console.log(`[MockEmailProvider] Scheduled mock email for ${scheduleTime.toISOString()}`)
    return {
      success: true,
      providerMessageId: `mock-sched-msg-${Date.now()}`,
      providerResponse: { status: 'scheduled', statusCode: 200 },
    }
  }

  async cancel(providerMessageId: string): Promise<EmailProviderResult> {
    console.log(`[MockEmailProvider] Cancelled mock scheduled email ${providerMessageId}`)
    return {
      success: true,
      providerResponse: { status: 'cancelled', statusCode: 200 },
    }
  }

  async retry(providerMessageId: string): Promise<EmailProviderResult> {
    console.log(`[MockEmailProvider] Retried mock email ${providerMessageId}`)
    return {
      success: true,
      providerMessageId: `mock-retry-msg-${Date.now()}`,
      providerResponse: { status: 'sent', statusCode: 200 },
    }
  }

  async validate(payload: EmailPayload): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = []
    if (!payload.toEmail || !payload.toEmail.includes('@')) {
      errors.push('Invalid recipient email address.')
    }
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  async health(): Promise<{ isHealthy: boolean; message?: string }> {
    return { isHealthy: true, message: 'Mock email provider healthy.' }
  }
}
