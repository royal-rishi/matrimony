import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/features/notification/otp/actions/otp.actions'
import type { OtpPurpose } from '@/features/notification/otp/types/otp.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mobile, code, purpose } = body

    if (!mobile || !code || !purpose) {
      return NextResponse.json(
        { error: 'Missing mobile, code, or purpose fields in request body' },
        { status: 400 }
      )
    }

    const result = await verifyOTP(
      mobile as string,
      code as string,
      purpose as OtpPurpose
    )

    if (result.success && result.verified) {
      return NextResponse.json({ success: true, verified: true })
    }

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: result.error || 'Verification failed',
        errorCode: result.errorCode,
        attemptsRemaining: result.attemptsRemaining,
      },
      { status: 400 }
    )
  } catch (err) {
    console.error('[POST /api/auth/verify-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
