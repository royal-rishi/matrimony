import { NextResponse } from 'next/server'
import { searchPayments, approveRefund } from '@/features/admin/actions/payment-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || undefined
  const limit = Number(searchParams.get('limit')) || 20
  const offset = Number(searchParams.get('offset')) || 0

  const res = await searchPayments({ search, status, limit, offset })
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await approveRefund(body)
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
