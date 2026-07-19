import { NextRequest, NextResponse } from 'next/server'
import { retryWhatsApp } from '@/features/notification/whatsapp/actions/whatsapp.actions'

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

    const result = await retryWhatsApp(whatsappQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to retry WhatsApp message' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/whatsapp/retry]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
