import { NextRequest, NextResponse } from 'next/server'
import { cancelEmail } from '@/features/notification/email/actions/email.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { emailQueueId } = body

    if (!emailQueueId) {
      return NextResponse.json(
        { success: false, error: 'Missing emailQueueId' },
        { status: 400 }
      )
    }

    const result = await cancelEmail(emailQueueId)
    if (result.success) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  } catch (err) {
    console.error('[API /api/email/cancel]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
