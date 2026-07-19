// ============================================================
// OTP ANALYTICS UTIL
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type { OtpChannel } from '../types/otp.types'

export class OTPAnalytics {
  /**
   * Updates daily metrics count for OTP in the `notification_analytics` table.
   */
  static async trackMetric(
    channel: OtpChannel,
    provider: string,
    metricType: 'sent' | 'delivered' | 'failed'
  ): Promise<void> {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    try {
      // Find or update record for today/channel/provider/event
      const eventKey = 'otp'

      // We read the existing analytics count if any
      const { data: existing } = await supabase
        .from('notification_analytics')
        .select('id, total_sent, delivered, failed, otp_sent')
        .eq('date', today)
        .eq('channel', channel)
        .eq('provider', provider)
        .eq('event', eventKey)
        .maybeSingle()

      if (existing) {
        const updateData: Record<string, number> = {}
        if (metricType === 'sent') {
          updateData.total_sent = (existing.total_sent || 0) + 1
          updateData.otp_sent = (existing.otp_sent || 0) + 1
        } else if (metricType === 'delivered') {
          updateData.delivered = (existing.delivered || 0) + 1
        } else if (metricType === 'failed') {
          updateData.failed = (existing.failed || 0) + 1
        }

        await supabase
          .from('notification_analytics')
          .update(updateData)
          .eq('id', existing.id)
      } else {
        const insertData = {
          date: today,
          channel,
          provider,
          event: eventKey,
          total_sent: metricType === 'sent' ? 1 : 0,
          emails_sent: 0,
          sms_sent: channel === 'sms' ? 1 : 0,
          whatsapp_sent: channel === 'whatsapp' ? 1 : 0,
          in_app_sent: 0,
          otp_sent: metricType === 'sent' ? 1 : 0,
          delivered: metricType === 'delivered' ? 1 : 0,
          failed: metricType === 'failed' ? 1 : 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          rejected: 0,
        }

        await supabase
          .from('notification_analytics')
          .insert(insertData)
      }
    } catch (err) {
      console.error('[OTPAnalytics] Failed to track metric:', err)
    }
  }
}
