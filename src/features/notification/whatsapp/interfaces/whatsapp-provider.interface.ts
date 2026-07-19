// ============================================================
// WHATSAPP PROVIDER INTERFACE
// ============================================================

import type { WhatsAppPayload, WhatsAppProviderResult, WhatsAppDeliveryStatus } from '../types/whatsapp.types'

export interface IWhatsAppProvider {
  readonly providerId: string
  readonly displayName: string

  /**
   * Dispatches template message to the WhatsApp Business API.
   */
  sendWhatsApp(payload: WhatsAppPayload): Promise<WhatsAppProviderResult>

  /**
   * Queries delivery status of a specific message ID.
   */
  getDeliveryStatus(providerMessageId: string): Promise<WhatsAppDeliveryStatus>

  /**
   * Health status ping.
   */
  healthCheck(): Promise<{ isHealthy: boolean; message?: string }>
}
