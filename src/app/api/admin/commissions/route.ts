import { NextResponse } from 'next/server'
import { getWithdrawalRequests, processWithdrawalRequest, applyCommissionAdjustment } from '@/features/admin/actions/commission-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined
  const limit = Number(searchParams.get('limit')) || 20
  const offset = Number(searchParams.get('offset')) || 0

  const res = await getWithdrawalRequests({ status, limit, offset })
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'process_withdrawal') {
      const res = await processWithdrawalRequest(body.requestId, body.status, body.notes)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    if (action === 'adjustment') {
      const res = await applyCommissionAdjustment(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
