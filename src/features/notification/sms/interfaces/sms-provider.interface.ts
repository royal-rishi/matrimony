// ============================================================
// SMS PROVIDER INTERFACE
// ============================================================

import type { SmsPayload, SmsProviderResult, SmsDeliveryStatus } from '../types/sms.types'

export interface ISmsProvider {
  readonly providerId: string
  readonly displayName: string
  
  /**
   * Send a single transactional SMS
   */
  sendSms(payload: SmsPayload): Promise<SmsProviderResult>

  /**
   * Fetch status from provider
   */
  getDeliveryStatus(providerMessageId: string): Promise<SmsDeliveryStatus>

  /**
   * Provider health check
   */
  healthCheck(): Promise<{ isHealthy: boolean; message?: string }>
}
