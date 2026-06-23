import { NextResponse } from 'next/server'
import { getDashboardKPIs } from '@/features/associate/actions/analytics-actions'

export async function GET() {
  try {
    const result = await getDashboardKPIs()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
