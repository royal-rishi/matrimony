import { NextResponse } from 'next/server'
import { getAuditLogs } from '@/features/admin/actions/audit-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const action = searchParams.get('action') || undefined
  const limit = Number(searchParams.get('limit')) || 25
  const offset = Number(searchParams.get('offset')) || 0

  const res = await getAuditLogs({ search, action, limit, offset })
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}
