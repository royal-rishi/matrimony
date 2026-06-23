import { NextResponse } from 'next/server'
import { getReferralStats, getReferralList } from '@/features/associate/actions/referral-actions'

export async function GET() {
  try {
    const statsResult = await getReferralStats()
    const listResult = await getReferralList()

    return NextResponse.json({
      success: true,
      data: {
        stats: statsResult.success ? statsResult.data : null,
        list: listResult.success ? listResult.data : [],
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
