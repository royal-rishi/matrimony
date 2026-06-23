import { NextResponse } from 'next/server'
import { getMyDisputes, respondToDispute } from '@/features/associate/actions/dispute-actions'

export async function GET() {
  try {
    const result = await getMyDisputes()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const result = await respondToDispute(body)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
