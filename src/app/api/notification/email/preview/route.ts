import { NextRequest, NextResponse } from 'next/server'
import { previewEmail } from '@/features/notification/email/actions/email.actions'

export async function GET(request: NextRequest) {
  try {
    const eventType = request.nextUrl.searchParams.get('eventType')
    const theme = (request.nextUrl.searchParams.get('theme') || 'brand') as any

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory query parameter: eventType.' },
        { status: 400 }
      )
    }

    const result = await previewEmail(eventType, {}, theme)
    return new NextResponse(result.html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (err) {
    console.error('[GET /api/notification/email/preview]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, variables, theme } = body

    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing mandatory field: eventType.' },
        { status: 400 }
      )
    }

    const result = await previewEmail(eventType, variables || {}, theme || 'brand')
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[POST /api/notification/email/preview]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
