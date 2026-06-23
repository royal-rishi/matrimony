import { NextResponse } from 'next/server'
import { getDashboardKPIs } from '@/features/admin/actions/dashboard-actions'

export async function GET() {
  const res = await getDashboardKPIs()
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}
