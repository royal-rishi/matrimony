import { NextRequest, NextResponse } from 'next/server'
import { cancelSMS } from '@/features/notification/sms/actions/sms.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { smsQueueId } = body

    if (!smsQueueId) {
      return NextResponse.json(
        { error: 'Missing mandatory field: smsQueueId.' },
        { status: 400 }
      )
    }

    const result = await cancelSMS(smsQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to cancel SMS' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/sms/cancel]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
