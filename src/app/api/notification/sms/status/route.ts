import { NextRequest, NextResponse } from 'next/server'
import { getSMSStatus } from '@/features/notification/sms/actions/sms.actions'

export async function GET(request: NextRequest) {
  try {
    const smsQueueId = request.nextUrl.searchParams.get('smsQueueId')

    if (!smsQueueId) {
      return NextResponse.json(
        { error: 'Missing mandatory query parameter: smsQueueId.' },
        { status: 400 }
      )
    }

    const result = await getSMSStatus(smsQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to fetch SMS status' }, { status: 400 })
  } catch (err) {
    console.error('[GET /api/notification/sms/status]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

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

    const result = await getSMSStatus(smsQueueId)
    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to fetch SMS status' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/sms/status]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
