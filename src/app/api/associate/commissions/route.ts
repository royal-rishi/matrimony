import { NextResponse } from 'next/server'
import { getCommissionLedger } from '@/features/associate/actions/wallet-actions'

export async function GET() {
  try {
    const result = await getCommissionLedger()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
