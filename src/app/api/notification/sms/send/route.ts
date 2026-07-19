import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, scheduleSMS } from '@/features/notification/sms/actions/sms.actions'

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
      const result = await scheduleSMS(toPhone, eventType, variables || {}, scheduledFor, userId)
      if (result.success) {
        return NextResponse.json({ success: true, data: result })
      }
      return NextResponse.json({ error: result.error || 'Failed to schedule SMS' }, { status: 400 })
    }

    const result = await sendSMS(toPhone, eventType, variables || {}, userId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/sms/send]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
