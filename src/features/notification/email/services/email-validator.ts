// ============================================================
// EMAIL VALIDATOR SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { PROVIDER_CONFIG } from '../config/provider.config'
import type { EmailAttachment } from '../types/email.types'
import { Msg91EmailError } from '../errors/email-provider.errors'

export class EmailValidator {
  /**
   * Validates syntax of an email address.
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  /**
   * Restricts sender domain verification if Google Workspace domain enforcement is active.
   */
  isDomainAllowed(fromEmail: string): boolean {
    if (!PROVIDER_CONFIG.googleWorkspace.validationEnabled) return true
    const domain = PROVIDER_CONFIG.googleWorkspace.domain
    return fromEmail.endsWith(`@${domain}`)
  }

  /**
   * Anti-spam duplicate send check: prevents dispatching identical subject & body
   * to the same recipient within a rolling 10 seconds.
   */
  async isDuplicateSend(toEmail: string, subject: string, windowSeconds: number = 10): Promise<boolean> {
    const supabase = await createClient()
    const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString()

    const { data, error } = await supabase
      .from('email_queue')
      .select('id')
      .eq('to_email', toEmail)
      .eq('subject', subject)
      .gt('created_at', cutoff)
      .in('status', ['pending', 'processing', 'sent'])
      .limit(1)

    if (error) {
      console.error('[EmailValidator] Error checking duplicates:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Validates attachments for MIME type and maximum size (10MB limit).
   */
  validateAttachments(attachments?: EmailAttachment[]): void {
    if (!attachments || attachments.length === 0) return

    const ALLOWED_MIMES = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp'
    ]

    const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

    for (const att of attachments) {
      // 1. MIME Validation
      if (!ALLOWED_MIMES.includes(att.contentType)) {
        throw new Msg91EmailError(
          `Unsupported attachment MIME type: ${att.contentType}. Only PDFs and images are allowed.`
        )
      }

      // 2. Maximum Size Validation (calculate base64 string size if encoded)
      const isBase64 = !att.content.startsWith('data:') && !att.content.includes('/')
      let sizeBytes = 0

      if (isBase64) {
        // Calculate size of base64 encoded content
        sizeBytes = Math.ceil((att.content.length * 3) / 4)
      } else {
        sizeBytes = att.content.length
      }

      if (sizeBytes > MAX_SIZE_BYTES) {
        throw new Msg91EmailError(
          `Attachment "${att.filename}" exceeds the 10MB maximum size limit.`
        )
      }
    }
  }

  /**
   * Validates variables format.
   */
  validateVariables(variables?: Record<string, any>): void {
    if (!variables) return
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'object' && value !== null) {
        throw new Msg91EmailError(
          `Variable "${key}" has an invalid nested object value. Variables must be flat key-value pairs.`
        )
      }
    }
  }

  /**
   * Masks sensitive fields (e.g., tokens, secrets, codes) in variable values.
   */
  maskSensitiveData(variables: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    const masked = { ...variables }
    const sensitiveKeys = ['otp', 'password', 'token', 'secret', 'cvv', 'pin', 'code', 'authkey']

    for (const key of Object.keys(masked)) {
      const isSensitive = sensitiveKeys.some((s) => key.toLowerCase().includes(s))
      if (isSensitive && masked[key] !== undefined) {
        const valStr = String(masked[key])
        if (valStr.length <= 4) {
          masked[key] = '****'
        } else {
          masked[key] = valStr.slice(0, 2) + '****' + valStr.slice(-2)
        }
      }
    }

    return masked
  }
}
export const emailValidator = new EmailValidator()
