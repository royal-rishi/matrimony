import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROVIDER_CONFIG } from '@/features/notification/email/config/provider.config'
import { EmailLogger } from '@/features/notification/email/utils/email.logger'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    // Verify MSG91 Webhook Signature (if webhook secret is configured)
    const secret = PROVIDER_CONFIG.msg91.webhookSecret
    const signature = request.headers.get('x-msg91-signature')
    
    if (secret && signature) {
      console.log('[Email Webhook] Signature verification received.')
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const { event, message_id, recipient, error_message, error_code } = payload

    if (!event || !message_id) {
      return NextResponse.json({ error: 'Missing mandatory payload variables.' }, { status: 400 })
    }

    const eventLower = event.toLowerCase()
    console.log(`[Email Webhook] Event received: ${eventLower} for msg: ${message_id}`)

    const supabase = await createClient()

    // 1. Fetch matching queue job by provider message ID
    const { data: job, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('provider_message_id', message_id)
      .maybeSingle()

    if (error || !job) {
      console.warn(`[Email Webhook] Message ID ${message_id} not tracked in queue.`)
      return NextResponse.json({ success: true, message: 'Message ID not tracked in queue.' })
    }

    const nowStr = new Date().toISOString()
    const updateData: Record<string, any> = { updated_at: nowStr }

    // 2. Map MSG91 event to queue table actions
    if (eventLower === 'delivered') {
      updateData.delivered_at = nowStr
      updateData.status = 'completed'
    } else if (eventLower === 'opened') {
      updateData.opened_at = nowStr
      updateData.status = 'completed'
    } else if (eventLower === 'clicked') {
      updateData.clicked_at = nowStr
      updateData.status = 'completed'
    } else if (eventLower === 'bounced') {
      updateData.bounced_at = nowStr
      updateData.status = 'failed'
      updateData.last_error = error_message || 'Hard bounce reported by carrier.'
    } else if (eventLower === 'complained' || eventLower === 'spam') {
      updateData.status = 'failed'
      updateData.last_error = 'Spam complaint recorded.'
    } else if (eventLower === 'failed') {
      updateData.status = 'failed'
      updateData.last_error = error_message || 'General delivery failure.'
    }

    await supabase
      .from('email_queue')
      .update(updateData)
      .eq('id', job.id)

    // 3. Fetch logs ID matching notification_id and channel = 'email'
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('notification_id', job.notification_id)
      .eq('channel', 'email')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const logId = logs?.id

    if (logId) {
      // 4. Update notification_logs columns
      const updateLogData: Record<string, any> = {
        updated_at: nowStr
      }

      if (eventLower === 'delivered') {
        updateLogData.status = 'delivered'
        updateLogData.delivered_at = nowStr
      } else if (eventLower === 'opened') {
        updateLogData.status = 'delivered'
        updateLogData.opened_at = nowStr
      } else if (eventLower === 'clicked') {
        updateLogData.status = 'delivered'
        updateLogData.clicked_at = nowStr
      } else if (eventLower === 'bounced') {
        updateLogData.status = 'failed'
        updateLogData.bounced_at = nowStr
        updateLogData.error_message = error_message || 'Bounced'
        updateLogData.error_code = error_code || 'BOUNCED'
      } else if (eventLower === 'spam' || eventLower === 'complained') {
        updateLogData.status = 'failed'
        updateLogData.error_message = 'Spam Complaint'
        updateLogData.error_code = 'SPAM'
      } else if (eventLower === 'failed') {
        updateLogData.status = 'failed'
        updateLogData.failed_at = nowStr
        updateLogData.error_message = error_message || 'Failed'
        updateLogData.error_code = error_code || 'FAILED'
      }

      await supabase
        .from('notification_logs')
        .update(updateLogData)
        .eq('id', logId)

      // 5. Call delivery_reports marking if appropriate
      if (eventLower === 'delivered' || eventLower === 'opened' || eventLower === 'clicked') {
        await EmailLogger.markDelivered(logId, job.notification_id, message_id, payload)
      } else if (eventLower === 'failed' || eventLower === 'bounced' || eventLower === 'complained' || eventLower === 'spam') {
        await EmailLogger.markFailed(
          logId,
          job.notification_id,
          error_message || 'Delivery failure',
          error_code || 'DELIVERY_ERR',
          'msg91-email'
        )
      }
    }

    // 6. Refresh aggregated analytics for the log date
    const jobDate = job.created_at ? job.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    await supabase.rpc('fn_upsert_daily_analytics', { p_date: jobDate })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/webhooks/msg91/email] Exception:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
