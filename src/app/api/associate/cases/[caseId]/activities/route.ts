import { NextResponse } from 'next/server'
import { getCaseTimeline } from '@/features/associate/actions/case-actions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const result = await getCaseTimeline(caseId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
