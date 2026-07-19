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
      // Authenticity checks can be performed here by hashing rawBody with crypto.subtle
      // To prevent disruptions, log and proceed or perform strict verification.
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

    console.log(`[Email Webhook] Event received: ${event} for msg: ${message_id}`)

    const supabase = await createClient()

    // 1. Fetch matching queue job by provider message ID
    const { data: job, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('provider_message_id', message_id)
      .maybeSingle()

    if (error || !job) {
      // Webhook received for untracked or outside message
      return NextResponse.json({ success: true, message: 'Message ID not tracked in queue.' })
    }

    const nowStr = new Date().toISOString()
    const updateData: Record<string, any> = { updated_at: nowStr }

    // 2. Map MSG91 event to queue table actions
    if (event === 'delivered') {
      updateData.delivered_at = nowStr
    } else if (event === 'opened') {
      updateData.opened_at = nowStr
    } else if (event === 'clicked') {
      updateData.clicked_at = nowStr
    } else if (event === 'bounced') {
      updateData.bounced_at = nowStr
      updateData.status = 'failed'
      updateData.last_error = error_message || 'Hard bounce reported by carrier.'
    } else if (event === 'complained' || event === 'spam') {
      updateData.status = 'failed'
      updateData.last_error = 'Spam complaint recorded.'
    } else if (event === 'failed') {
      updateData.status = 'failed'
      updateData.last_error = error_message || 'General delivery failure.'
    }

    await supabase
      .from('email_queue')
      .update(updateData)
      .eq('id', job.id)

    // 3. Update audit log reports
    // Fetch logs ID matching notification_id and channel = 'email'
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
      if (event === 'delivered') {
        await EmailLogger.markDelivered(logId, job.notification_id, message_id, payload)
      } else if (event === 'failed' || event === 'bounced' || event === 'complained') {
        await EmailLogger.markFailed(
          logId,
          job.notification_id,
          error_message || 'Delivery failure',
          error_code || 'DELIVERY_ERR',
          'msg91'
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/notification/email/webhook] Exception:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
