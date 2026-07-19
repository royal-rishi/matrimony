import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const whatsappQueueId = request.nextUrl.searchParams.get('whatsappQueueId')

    if (!whatsappQueueId) {
      return NextResponse.json(
        { error: 'Missing mandatory query parameter: whatsappQueueId.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: job, error } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('id', whatsappQueueId)
      .maybeSingle()

    if (error || !job) {
      return NextResponse.json({ error: 'WhatsApp queue job not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        status: job.status,
        attempts: job.attempts,
        sentAt: job.sent_at,
        deliveredAt: job.delivered_at,
        readAt: job.read_at,
        lastError: job.last_error,
        providerMessageId: job.provider_message_id,
      },
    })
  } catch (err) {
    console.error('[GET /api/notification/whatsapp/status]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { whatsappQueueId } = body

    if (!whatsappQueueId) {
      return NextResponse.json(
        { error: 'Missing mandatory field: whatsappQueueId.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: job, error } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('id', whatsappQueueId)
      .maybeSingle()

    if (error || !job) {
      return NextResponse.json({ error: 'WhatsApp queue job not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        status: job.status,
        attempts: job.attempts,
        sentAt: job.sent_at,
        deliveredAt: job.delivered_at,
        readAt: job.read_at,
        lastError: job.last_error,
        providerMessageId: job.provider_message_id,
      },
    })
  } catch (err) {
    console.error('[POST /api/notification/whatsapp/status]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
