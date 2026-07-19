// ============================================================
// SMS VALIDATOR SERVICE
// ============================================================

import { createClient } from '@/lib/supabase/server'

export class SMSValidator {
  /**
   * Validates if a phone number complies with E.164 formatting standards.
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{7,14}$/
    return phoneRegex.test(phone)
  }

  /**
   * Prevents duplicate sends by checking if an identical message body was
   * dispatched to the same phone number within a short window (e.g. 10 seconds).
   */
  async isDuplicateSend(toPhone: string, body: string, windowSeconds: number = 10): Promise<boolean> {
    const supabase = await createClient()
    const now = new Date()
    const cutoffTime = new Date(now.getTime() - windowSeconds * 1000).toISOString()

    const { data, error } = await supabase
      .from('sms_queue')
      .select('id')
      .eq('to_phone', toPhone)
      .eq('message_body', body)
      .gt('created_at', cutoffTime)
      .in('status', ['pending', 'processing', 'sent'])
      .limit(1)

    if (error) {
      console.error('[SMSValidator] Error checking duplicates:', error)
      return false
    }

    return data && data.length > 0
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
