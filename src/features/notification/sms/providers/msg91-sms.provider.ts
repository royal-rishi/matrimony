// ============================================================
// MSG91 SMS PROVIDER IMPLEMENTATION
// ============================================================

import type { ISmsProvider } from '../interfaces/sms-provider.interface'
import type { SmsPayload, SmsProviderResult, SmsDeliveryStatus } from '../types/sms.types'
import { PROVIDER_CONFIG } from '../config/provider.config'

export class Msg91SmsProvider implements ISmsProvider {
  readonly providerId = 'msg91-sms'
  readonly displayName = 'MSG91 SMS Provider'

  private get authKey(): string {
    return PROVIDER_CONFIG.msg91.authKey
  }

  private get senderId(): string {
    return PROVIDER_CONFIG.msg91.senderId
  }

  private get defaultFlowId(): string {
    return PROVIDER_CONFIG.msg91.defaultFlowId
  }

  /**
   * Dispatches SMS via MSG91 Flow API.
   * DLT-registered Flow ID and variables are sent in request.
   */
  async sendSms(payload: SmsPayload): Promise<SmsProviderResult> {
    if (!this.authKey) {
      return { success: false, error: 'MSG91 Auth Key is not configured.' }
    }

    try {
      // MSG91 flow API uses mobile without '+' for sending, but E.164 has '+'.
      // Strip leading plus.
      const formattedMobile = payload.toPhone.replace(/^\+/, '')

      // DLT flow ID to use: payload override or provider default.
      const flowId = payload.dltTemplateId || this.defaultFlowId
      if (!flowId) {
        return { success: false, error: 'No Flow ID or DLT Template ID specified.' }
      }

      // Map template variables. Flow API expects variables at root level or in parameters.
      // MSG91 Flow structure:
      // {
      //   "flow_id": "...",
      //   "sender": "...",
      //   "mobiles": "91XXXXXXXXXX",
      //   "VAR1": "val1", ...
      // }
      const requestBody = {
        flow_id: flowId,
        sender: payload.senderId || this.senderId,
        mobiles: formattedMobile,
        ...payload.templateVariables,
      }

      const response = await fetch(`${PROVIDER_CONFIG.msg91.baseUrl}${PROVIDER_CONFIG.msg91.endpoints.sendFlow}`, {
        method: 'POST',
        headers: {
          'authkey': this.authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (response.ok && responseData.type === 'success') {
        return {
          success: true,
          providerMessageId: responseData.request_id || `msg91-${Date.now()}`,
          providerResponse: responseData,
        }
      }

      return {
        success: false,
        error: responseData.message || `MSG91 failed with HTTP status ${response.status}`,
        providerResponse: responseData,
      }
    } catch (err) {
      console.error('[Msg91SmsProvider] Failed to dispatch SMS:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown provider error',
      }
    }
  }

  /**
   * Polls or maps MSG91 delivery report status.
   */
  async getDeliveryStatus(providerMessageId: string): Promise<SmsDeliveryStatus> {
    if (!this.authKey) return 'failed'

    try {
      // MSG91 delivery report query:
      // GET https://control.msg91.com/api/v5/webhooks/getSmsStatus?request_id=...
      const response = await fetch(
        `${PROVIDER_CONFIG.msg91.baseUrl}${PROVIDER_CONFIG.msg91.endpoints.getSmsStatus}?request_id=${providerMessageId}`,
        {
          method: 'GET',
          headers: {
            'authkey': this.authKey,
          },
        }
      )

      if (!response.ok) return 'processing'

      const data = await response.json()
      // Status mapping:
      // 1 = Delivered, 2 = Failed, 3 = Sent (Pending Carrier), 16 = Rejected/Bounced
      const statusCode = data?.status
      if (statusCode === 1 || statusCode === 'Delivered') return 'delivered'
      if (statusCode === 2 || statusCode === 'Failed') return 'failed'
      if (statusCode === 16 || statusCode === 'Rejected') return 'failed'
      if (statusCode === 3 || statusCode === 'Sent') return 'sent'

      return 'processing'
    } catch (err) {
      console.error('[Msg91SmsProvider] Error getting delivery report:', err)
      return 'processing'
    }
  }

  async healthCheck(): Promise<{ isHealthy: boolean; message?: string }> {
    if (!this.authKey) {
      return { isHealthy: false, message: 'Auth Key missing.' }
    }
    // Perform simple ping or configuration check
    return { isHealthy: true, message: 'MSG91 Provider Configured.' }
  }
}
