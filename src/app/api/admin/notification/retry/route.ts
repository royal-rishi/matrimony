import { NextRequest, NextResponse } from 'next/server'
import { retryNotification, retryAll } from '@/features/admin/notification/actions/admin-notifications.actions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, failedNotificationId } = body

    if (action === 'retry_all') {
      const res = await retryAll()
      if (res.success) {
        return NextResponse.json({ success: true, data: res })
      }
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    if (!failedNotificationId) {
      return NextResponse.json({ error: 'Missing failedNotificationId.' }, { status: 400 })
    }

    const res = await retryNotification(failedNotificationId)
    if (res.success) {
      return NextResponse.json({ success: true, data: res })
    }
    return NextResponse.json({ error: res.error }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/admin/notification/retry]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
