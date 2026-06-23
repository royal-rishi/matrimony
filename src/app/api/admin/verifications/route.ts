import { NextResponse } from 'next/server'
import { getVerificationQueue, verifyUserKYC } from '@/features/admin/actions/verification-actions'

export async function GET() {
  const res = await getVerificationQueue()
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await verifyUserKYC(body)
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
