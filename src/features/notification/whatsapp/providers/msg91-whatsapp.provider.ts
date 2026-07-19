// ============================================================
// MSG91 WHATSAPP PROVIDER (Production Integration)
// ============================================================

import type { IWhatsAppProvider } from '../interfaces/whatsapp-provider.interface'
import type { WhatsAppPayload, WhatsAppProviderResult, WhatsAppDeliveryStatus } from '../types/whatsapp.types'
import { PROVIDER_CONFIG } from '../config/provider.config'
import { WHATSAPP_TEMPLATES_REGISTRY } from '../templates/whatsapp-templates.registry'
import { WhatsAppRenderer } from '../services/whatsapp-renderer'

export class Msg91WhatsAppProvider implements IWhatsAppProvider {
  readonly providerId = 'msg91-whatsapp'
  readonly displayName = 'MSG91 WhatsApp Provider'

  async sendWhatsApp(payload: WhatsAppPayload): Promise<WhatsAppProviderResult> {
    const authKey = PROVIDER_CONFIG.msg91.authKey
    const url = PROVIDER_CONFIG.msg91.apiUrl

    if (!authKey) {
      return { success: false, error: 'Missing MSG91_WHATSAPP_AUTH_KEY. Provider not configured.' }
    }

    try {
      // 1. Clean phone number (strip leading + for MSG91, which expects country code + mobile format)
      const cleanMobile = payload.toPhone.replace('+', '').trim()

      // 2. Fetch template schema mapping from registry
      const schema = WHATSAPP_TEMPLATES_REGISTRY[payload.templateName]
      if (!schema) {
        return { success: false, error: `WhatsApp template schema '${payload.templateName}' not found in registry.` }
      }

      // 3. Render positional components array
      const components = WhatsAppRenderer.renderComponents(schema, payload.variables || {}, {
        mediaUrl: payload.mediaUrl,
        mediaType: payload.mediaType,
      })

      // 4. Construct payload structure
      const apiPayload = {
        to: cleanMobile,
        type: 'template',
        template: {
          name: schema.templateName,
          language: {
            code: payload.language || 'en',
          },
          components,
        },
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify(apiPayload),
      })

      const text = await response.text()
      let json: any = {}
      try {
        json = JSON.parse(text)
      } catch {
        json = { rawResponse: text }
      }

      if (!response.ok || (json.status === 'error' || json.type === 'error')) {
        return {
          success: false,
          error: json.message || json.error || text || 'API call failed.',
          providerResponse: json,
        }
      }

      const msgId = json.request_id || json.message_id || `msg91-wa-${Date.now()}`

      return {
        success: true,
        providerMessageId: msgId,
        providerResponse: json,
      }
    } catch (err) {
      console.error('[Msg91WhatsAppProvider] Send failed:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown network transport failure.',
      }
    }
  }

  async getDeliveryStatus(providerMessageId: string): Promise<WhatsAppDeliveryStatus> {
    // Verified via webhooks asynchronously.
    return 'sent'
  }

  async healthCheck(): Promise<{ isHealthy: boolean; message?: string }> {
    const authKey = PROVIDER_CONFIG.msg91.authKey
    if (!authKey) {
      return { isHealthy: false, message: 'Missing MSG91_WHATSAPP_AUTH_KEY.' }
    }
    return { isHealthy: true, message: 'WhatsApp provider ready.' }
  }
}
