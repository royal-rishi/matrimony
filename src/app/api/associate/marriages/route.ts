import { NextResponse } from 'next/server'
import { getMarriageSuccesses, recordMarriageSuccess } from '@/features/associate/actions/marriage-actions'

export async function GET() {
  try {
    const result = await getMarriageSuccesses()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await recordMarriageSuccess(body)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
