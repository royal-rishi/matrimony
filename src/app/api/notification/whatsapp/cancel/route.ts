import { NextRequest, NextResponse } from 'next/server'
import { cancelWhatsApp } from '@/features/notification/whatsapp/actions/whatsapp.actions'

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

    const result = await cancelWhatsApp(whatsappQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to cancel WhatsApp message' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/whatsapp/cancel]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
