import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/features/notification/email/actions/email.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toEmail, eventType = 'auth.welcome', variables = {} } = body

    if (!toEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing toEmail' },
        { status: 400 }
      )
    }

    const result = await sendTestEmail(toEmail, eventType, variables)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  } catch (err) {
    console.error('[API /api/email/test]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
