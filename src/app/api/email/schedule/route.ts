import { NextRequest, NextResponse } from 'next/server'
import { EmailFactory } from '@/features/notification/email/factory/email.factory'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, eventType, variables = {}, scheduledFor, userId } = body

    if (!toEmail || !eventType || !scheduledFor) {
      return NextResponse.json(
        { success: false, error: 'Missing toEmail, eventType or scheduledFor' },
        { status: 400 }
      )
    }

    const date = new Date(scheduledFor)
    if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Invalid scheduledFor date. Must be in the future.' },
        { status: 400 }
      )
    }

    const service = EmailFactory.create()
    const result = await service.sendEmail(toEmail, eventType, variables, {
      userId,
      scheduledFor: date,
    })

    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  } catch (err) {
    console.error('[API /api/email/schedule]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
