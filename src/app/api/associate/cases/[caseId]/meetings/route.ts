import { NextResponse } from 'next/server'
import { scheduleMeeting } from '@/features/associate/actions/case-actions'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('associate_case_meetings')
      .select('*')
      .eq('case_id', caseId)
      .order('scheduled_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params
    const body = await request.json()
    const result = await scheduleMeeting({ caseId, ...body })
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
