import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, scheduleWhatsApp } from '@/features/notification/whatsapp/actions/whatsapp.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toPhone, eventType, variables, userId, scheduledFor } = body

    if (!toPhone || !eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: toPhone or eventType.' },
        { status: 400 }
      )
    }

    if (scheduledFor) {
      const result = await scheduleWhatsApp(toPhone, eventType, variables || {}, scheduledFor, userId)
      if (result.success) {
        return NextResponse.json({ success: true, data: result })
      }
      return NextResponse.json({ error: result.error || 'Failed to schedule WhatsApp message' }, { status: 400 })
    }

    const result = await sendWhatsApp(toPhone, eventType, variables || {}, userId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to send WhatsApp message' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/whatsapp/send]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
