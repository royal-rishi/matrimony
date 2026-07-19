import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/features/notification/email/actions/email.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, eventType, variables } = body

    if (!toEmail || !eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: toEmail or eventType.' },
        { status: 400 }
      )
    }

    const result = await sendTestEmail(toEmail, eventType, variables || {})
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to send test email' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/email/test]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
