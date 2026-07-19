// ============================================================
// EMAIL PROVIDER INTERFACE
// ============================================================

import type { EmailPayload, EmailProviderResult, EmailDeliveryStatus } from '../types/email.types'

export interface IEmailProvider {
  readonly providerId: string
  readonly displayName: string

  /**
   * Dispatches email to the gateway immediately.
   */
  send(payload: EmailPayload): Promise<EmailProviderResult>

  /**
   * Schedules email to be dispatched in the future.
   */
  schedule(payload: EmailPayload, scheduleTime: Date): Promise<EmailProviderResult>

  /**
   * Cancels a scheduled email dispatch.
   */
  cancel(providerMessageId: string): Promise<EmailProviderResult>

  /**
   * Retries dispatching a failed email.
   */
  retry(providerMessageId: string): Promise<EmailProviderResult>

  /**
   * Validates email payload.
   */
  validate(payload: EmailPayload): Promise<{ isValid: boolean; errors?: string[] }>

  /**
   * Performs connectivity check to the gateway.
   */
  health(): Promise<{ isHealthy: boolean; message?: string }>

  // Legacy signatures to prevent breaking changes:
  sendEmail(payload: EmailPayload): Promise<EmailProviderResult>
  getDeliveryStatus(providerMessageId: string): Promise<EmailDeliveryStatus>
  healthCheck(): Promise<{ isHealthy: boolean; message?: string }>
}
