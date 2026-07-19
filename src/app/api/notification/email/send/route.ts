import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, scheduleEmail } from '@/features/notification/email/actions/email.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, eventType, variables, userId, scheduledFor } = body

    if (!toEmail || !eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: toEmail or eventType.' },
        { status: 400 }
      )
    }

    if (scheduledFor) {
      const result = await scheduleEmail(toEmail, eventType, variables || {}, scheduledFor, userId)
      if (result.success) {
        return NextResponse.json({ success: true, data: result })
      }
      return NextResponse.json({ error: result.error || 'Failed to schedule email' }, { status: 400 })
    }

    const result = await sendEmail(toEmail, eventType, variables || {}, userId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/email/send]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
