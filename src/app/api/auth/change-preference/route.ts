import { NextRequest, NextResponse } from 'next/server'
import { changeOTPPreference } from '@/features/notification/otp/actions/otp.actions'
import type { OtpPreference } from '@/features/notification/otp/types/otp-database.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { preference } = body

    if (!preference) {
      return NextResponse.json(
        { error: 'Missing preference field in request body' },
        { status: 400 }
      )
    }

    if (preference !== 'sms' && preference !== 'whatsapp' && preference !== 'fallback') {
      return NextResponse.json(
        { error: 'Invalid preference value. Must be sms, whatsapp, or fallback' },
        { status: 400 }
      )
    }

    const result = await changeOTPPreference(preference as OtpPreference)

    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json(
      { error: result.error || 'Failed to change preferred channel' },
      { status: 400 }
    )
  } catch (err) {
    console.error('[POST /api/auth/change-preference]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
