import { NextRequest, NextResponse } from 'next/server'
import { EmailFactory } from '@/features/notification/email/factory/email.factory'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, eventType, variables = {}, userId } = body

    if (!toEmail || !eventType) {
      return NextResponse.json(
        { success: false, error: 'Missing toEmail or eventType' },
        { status: 400 }
      )
    }

    const service = EmailFactory.create()
    const result = await service.sendEmail(toEmail, eventType, variables, { userId })

    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  } catch (err) {
    console.error('[API /api/email/send]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
