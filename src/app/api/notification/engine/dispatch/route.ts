import { NextRequest, NextResponse } from 'next/server'
import { notificationEngine } from '@/features/notification/engine/services/notification-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, eventType, variables, channels, priority, scheduledFor, metadata } = body

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory fields: userId or eventType.' },
        { status: 400 }
      )
    }

    if (scheduledFor) {
      const date = new Date(scheduledFor)
      if (isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Invalid scheduling date. Must be in the future.' }, { status: 400 })
      }

      const result = await notificationEngine.schedule(
        {
          userId,
          eventType,
          variables: variables || {},
          channels,
          priority,
          metadata,
        },
        date
      )

      if (result.success) {
        return NextResponse.json({ success: true, data: result })
      }
      return NextResponse.json({ error: result.error || 'Failed to schedule notification.' }, { status: 400 })
    }

    const result = await notificationEngine.dispatch({
      userId,
      eventType,
      variables: variables || {},
      channels,
      priority,
      metadata,
    })

    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }
    return NextResponse.json({ error: result.error || 'Failed to dispatch notification.' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/engine/dispatch]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
