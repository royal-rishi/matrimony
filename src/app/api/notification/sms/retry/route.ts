import { NextRequest, NextResponse } from 'next/server'
import { retrySMS } from '@/features/notification/sms/actions/sms.actions'

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

    const result = await retrySMS(smsQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to retry SMS' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/sms/retry]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
