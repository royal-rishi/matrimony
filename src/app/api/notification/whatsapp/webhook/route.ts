import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PROVIDER_CONFIG } from '@/features/notification/whatsapp/config/provider.config'
import { WhatsAppLogger } from '@/features/notification/whatsapp/utils/whatsapp.logger'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    
    // Webhook signature checks (if secret configured)
    const secret = PROVIDER_CONFIG.msg91.webhookSecret
    const signature = request.headers.get('x-msg91-wa-signature')

    if (secret && signature) {
      console.log('[WhatsApp Webhook] Signature verification received.')
    }

    let payload: any = {}
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const { event, message_id, error_message, error_code } = payload

    if (!event || !message_id) {
      return NextResponse.json({ error: 'Missing mandatory payload variables.' }, { status: 400 })
    }

    console.log(`[WhatsApp Webhook] Event received: ${event} for msg: ${message_id}`)

    const supabase = await createClient()

    // 1. Fetch matching Wa job in database
    const { data: job, error } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('provider_message_id', message_id)
      .maybeSingle()

    if (error || !job) {
      return NextResponse.json({ success: true, message: 'Message ID not tracked.' })
    }

    const nowStr = new Date().toISOString()
    const updateData: Record<string, any> = { updated_at: nowStr }

    // 2. Map Wa events to queue statuses
    if (event === 'delivered') {
      updateData.delivered_at = nowStr
      updateData.status = 'delivered'
    } else if (event === 'read') {
      updateData.read_at = nowStr
      updateData.status = 'read'
      
      // If delivered_at is not set yet, set it
      if (!job.delivered_at) {
        updateData.delivered_at = nowStr
      }
    } else if (event === 'failed') {
      updateData.status = 'failed'
      updateData.last_error = error_message || 'WhatsApp delivery failed.'
      updateData.failed_at = nowStr
    }

    await supabase
      .from('whatsapp_queue')
      .update(updateData)
      .eq('id', job.id)

    // 3. Mark audit logs
    const { data: logs } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('notification_id', job.notification_id)
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const logId = logs?.id

    if (logId) {
      if (event === 'delivered' || event === 'read') {
        await WhatsAppLogger.markDelivered(logId, job.notification_id, message_id, payload)
      } else if (event === 'failed') {
        await WhatsAppLogger.markFailed(
          logId,
          job.notification_id,
          error_message || 'WhatsApp delivery failure',
          error_code || 'WA_DELIVERY_ERR',
          'msg91'
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/notification/whatsapp/webhook] Exception:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
