import { NextRequest, NextResponse } from 'next/server'
import { sendTestWhatsApp } from '@/features/notification/whatsapp/actions/whatsapp.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toPhone, eventType, variables } = body

    if (!toPhone || !eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: toPhone or eventType.' },
        { status: 400 }
      )
    }

    const result = await sendTestWhatsApp(toPhone, eventType, variables || {})
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to send test WhatsApp' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/whatsapp/test]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
