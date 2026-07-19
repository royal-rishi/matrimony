// ============================================================
// EMAIL PROVIDER BASE CLASS
// ============================================================

import type { IEmailProvider } from './email-provider.interface'
import type { EmailPayload, EmailProviderResult, EmailDeliveryStatus } from '../types/email.types'

export abstract class EmailProvider implements IEmailProvider {
  abstract readonly providerId: string
  abstract readonly displayName: string

  abstract send(payload: EmailPayload): Promise<EmailProviderResult>
  abstract schedule(payload: EmailPayload, scheduleTime: Date): Promise<EmailProviderResult>
  abstract cancel(providerMessageId: string): Promise<EmailProviderResult>
  abstract retry(providerMessageId: string): Promise<EmailProviderResult>
  abstract validate(payload: EmailPayload): Promise<{ isValid: boolean; errors?: string[] }>
  abstract health(): Promise<{ isHealthy: boolean; message?: string }>

  // Legacy mappings for backward compatibility:
  async sendEmail(payload: EmailPayload): Promise<EmailProviderResult> {
    return this.send(payload)
  }

  async getDeliveryStatus(providerMessageId: string): Promise<EmailDeliveryStatus> {
    return 'sent'
  }

  async healthCheck(): Promise<{ isHealthy: boolean; message?: string }> {
    return this.health()
  }
}
