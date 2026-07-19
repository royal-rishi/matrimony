import { NextRequest, NextResponse } from 'next/server'
import { cancelEmail } from '@/features/notification/email/actions/email.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailQueueId } = body

    if (!emailQueueId) {
      return NextResponse.json(
        { error: 'Missing mandatory field: emailQueueId.' },
        { status: 400 }
      )
    }

    const result = await cancelEmail(emailQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to cancel email' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/email/cancel]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
