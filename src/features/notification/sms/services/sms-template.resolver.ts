// ============================================================
// SMS TEMPLATE RESOLVER
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { NotificationTemplate } from '../../types/notification-database.types'
import { SMS_CONFIG } from '../config/sms.config'
import { ANALYTICS_CONFIG } from '../config/analytics.config'

export class SMSTemplateResolver {
  /**
   * Fetches an active SMS template from the database based on event type and language.
   * Falls back to default language ('en') if language template is not found.
   */
  async resolveTemplate(
    eventType: string,
    language: string = SMS_CONFIG.defaultLanguage
  ): Promise<NotificationTemplate | null> {
    const supabase = await createClient()

    // 1. Fetch template matching channel = 'sms', event = eventType, status = 'active'
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('channel', 'sms')
      .eq('event', eventType)
      .eq('status', 'active')

    if (error || !templates || templates.length === 0) {
      console.warn(`[SMSTemplateResolver] No active SMS template found for event: ${eventType}`)
      return null
    }

    // 2. Try to match requested language, otherwise fallback to default
    const matched = templates.find((t: any) => t.language === language)
    if (matched) return matched

    const defaultMatched = templates.find((t: any) => t.language === SMS_CONFIG.defaultLanguage)
    if (defaultMatched) return defaultMatched

    // Fallback to first available
    return templates[0] || null
  }

  /**
   * Safe variable substitution of {{variable}} placeholders in template body.
   * If a value is missing, it keeps the placeholder or defaults it to empty string.
   */
  renderBody(body: string, variables: Record<string, string | number | boolean>): string {
    let rendered = body
    
    // Replace all {{key}} placeholders
    const regex = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g
    rendered = rendered.replace(regex, (match, key) => {
      const value = variables[key]
      return value !== undefined ? String(value) : match
    })

    return rendered
  }

  /**
   * Detects non-GSM-7 characters to flag Unicode encoding.
   */
  isUnicodeMessage(text: string): boolean {
    // Standard GSM-7 character set regex (including basic and extended characters)
    const gsm7Regex = /^[A-Za-z0-9@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,\-./:;<=>?¡¿ÄÖÑÜ§àäöñüà^{}\\[~\]|€]*$/
    return !gsm7Regex.test(text)
  }

  /**
   * Calculates the SMS segment count and cost per segment.
   */
  calculateSegments(text: string): { segmentCount: number; isUnicode: boolean; costPerSegment: number } {
    const isUnicode = this.isUnicodeMessage(text)
    const len = text.length
    let segmentCount = 1

    const limits = SMS_CONFIG.limits

    if (isUnicode) {
      if (len > limits.unicodeSegmentLength) {
        segmentCount = Math.ceil(len / limits.unicodeConcatSegmentLength)
      }
    } else {
      if (len > limits.gsm7SegmentLength) {
        segmentCount = Math.ceil(len / limits.gsm7ConcatSegmentLength)
      }
    }

    // Cap segments to maximum
    segmentCount = Math.min(segmentCount, limits.maxSegments)

    return {
      segmentCount,
      isUnicode,
      costPerSegment: ANALYTICS_CONFIG.defaultCostPerSms,
    }
  }
}
