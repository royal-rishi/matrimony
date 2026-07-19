// ============================================================
// MSG91 EMAIL PROVIDER (Production Integration)
// ============================================================

import { EmailProvider } from './email.provider'
import type { EmailPayload, EmailProviderResult, EmailDeliveryStatus } from '../types/email.types'
import { PROVIDER_CONFIG } from '../config/provider.config'
import { EMAIL_CONFIG } from '../config/email.config'
import { Msg91EmailError } from '../errors/email-provider.errors'

export class Msg91EmailProvider extends EmailProvider {
  readonly providerId = 'msg91-email'
  readonly displayName = 'MSG91 Email Provider'

  async send(payload: EmailPayload): Promise<EmailProviderResult> {
    const rawAuthKey = PROVIDER_CONFIG.msg91.authKey
    const url = PROVIDER_CONFIG.msg91.baseUrl
    const domain = PROVIDER_CONFIG.msg91.domain

    // Mask auth key for safe logging / errors
    const maskedAuthKey = rawAuthKey
      ? `${rawAuthKey.slice(0, 4)}...${rawAuthKey.slice(-4)}`
      : 'UNDEFINED'

    if (!rawAuthKey) {
      throw new Msg91EmailError('Missing MSG91_EMAIL_AUTH_KEY. Provider not configured.')
    }

    // Set up abort controller for 30 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const fromEmail = payload.fromEmail || EMAIL_CONFIG.fromEmail
      const fromName = payload.fromName || EMAIL_CONFIG.fromName
      const replyTo = payload.replyTo || EMAIL_CONFIG.replyTo

      // MSG91 Email v5 API strictly requires a template_id
      const templateId = payload.templateId
      if (!templateId) {
        throw new Msg91EmailError('MSG91 Email API v5 requires a valid Template ID.')
      }

      // Map payload to MSG91 Email API format
      const body = {
        template_id: templateId,
        domain: domain,
        from: {
          name: fromName,
          email: fromEmail,
        },
        recipients: [
          {
            to: [
              {
                name: payload.toName || payload.toEmail.split('@')[0] || 'Member',
                email: payload.toEmail,
              },
            ],
            variables: payload.variables || {},
          },
        ],
        reply_to: replyTo
          ? [
              {
                email: replyTo,
              },
            ]
          : [],
        attachments: payload.attachments?.map((att) => {
          // If attachment content is base64, map it as a Data URI path
          const path = att.content.startsWith('data:') 
            ? att.content 
            : `data:${att.contentType};base64,${att.content}`
          
          return {
            name: att.filename,
            path: path,
          }
        }) || [],
      }

      console.log(`[Msg91EmailProvider] Sending email to ${payload.toEmail} using template ${templateId} via auth key ${maskedAuthKey}`)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: rawAuthKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const text = await response.text()
      let json: any = {}
      try {
        json = JSON.parse(text)
      } catch {
        json = { rawResponse: text }
      }

      // Record statusCode on response payload for granular retry checks
      const providerResponsePayload = {
        statusCode: response.status,
        data: json,
      }

      if (!response.ok || (json.hasError || json.status === 'error')) {
        const errorMsg = json.message || json.error || text || 'API call failed.'
        console.error(`[Msg91EmailProvider] Send failed (HTTP ${response.status}):`, errorMsg)
        
        return {
          success: false,
          error: errorMsg,
          providerResponse: providerResponsePayload,
        }
      }

      // MSG91 returns message ID in data or request_id
      const msgId = json.data?.message_id || json.request_id || `msg91-email-${Date.now()}`

      return {
        success: true,
        providerMessageId: msgId,
        providerResponse: providerResponsePayload,
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('[Msg91EmailProvider] Transport exception:', err)
      const message = err instanceof Error ? err.message : 'Unknown transport error'
      
      // Mask any auth key that might leak inside the exception message
      const cleanedMessage = message.replace(rawAuthKey, maskedAuthKey)
      
      throw new Msg91EmailError(cleanedMessage, undefined, err)
    }
  }

  async schedule(payload: EmailPayload, scheduleTime: Date): Promise<EmailProviderResult> {
    // Rely on database queue scheduling system
    return {
      success: false,
      error: 'Provider-side scheduling not supported. Use the email queue scheduler.',
    }
  }

  async cancel(providerMessageId: string): Promise<EmailProviderResult> {
    // Scheduled dispatches are cancelled by removing or updating status in the email_queue table
    return {
      success: false,
      error: 'Cancel operations should be handled via the Database Queue Service.',
    }
  }

  async retry(providerMessageId: string): Promise<EmailProviderResult> {
    // Retries are orchestrated through the Retry worker service
    return {
      success: false,
      error: 'Retry operations should be handled via the Email Retry Service.',
    }
  }

  async validate(payload: EmailPayload): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = []
    if (!payload.toEmail || !payload.toEmail.includes('@')) {
      errors.push('Invalid recipient email address.')
    }
    if (!payload.templateId) {
      errors.push('Missing Template ID.')
    }
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  async health(): Promise<{ isHealthy: boolean; message?: string }> {
    const authKey = PROVIDER_CONFIG.msg91.authKey
    if (!authKey) {
      return { isHealthy: false, message: 'Missing MSG91_EMAIL_AUTH_KEY.' }
    }
    return { isHealthy: true, message: 'MSG91 email credentials present.' }
  }
}
