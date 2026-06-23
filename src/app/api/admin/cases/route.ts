import { NextResponse } from 'next/server'
import { getAdminCases, assignAssociateToCase, closeCase } from '@/features/admin/actions/case-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || undefined
  const priority = searchParams.get('priority') || undefined
  const limit = Number(searchParams.get('limit')) || 20
  const offset = Number(searchParams.get('offset')) || 0

  const res = await getAdminCases({ search, status, priority, limit, offset })
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'assign_associate') {
      const res = await assignAssociateToCase(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    if (action === 'close') {
      const res = await closeCase(body.caseId, body.reason)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
