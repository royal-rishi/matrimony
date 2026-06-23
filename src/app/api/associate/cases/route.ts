import { NextResponse } from 'next/server'
import { getCases, createCase } from '@/features/associate/actions/case-actions'
import type { CaseStage } from '@/types/database'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as CaseStage | undefined
    const priority = searchParams.get('priority') || undefined
    const search = searchParams.get('search') || undefined

    const result = await getCases({ status, priority, search })
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createCase(body)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
