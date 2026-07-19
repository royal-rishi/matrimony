import { NextRequest, NextResponse } from 'next/server'
import { resendOTP } from '@/features/notification/otp/actions/otp.actions'
import type { OtpPurpose } from '@/features/notification/otp/types/otp.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mobile, purpose } = body

    if (!mobile || !purpose) {
      return NextResponse.json(
        { error: 'Missing mobile or purpose fields in request body' },
        { status: 400 }
      )
    }

    const result = await resendOTP(mobile as string, purpose as OtpPurpose)

    if (result.success) {
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json(
      { error: result.error || 'Failed to resend verification code' },
      { status: 400 }
    )
  } catch (err) {
    console.error('[POST /api/auth/resend-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
