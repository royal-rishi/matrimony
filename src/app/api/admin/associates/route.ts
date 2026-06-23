import { NextResponse } from 'next/server'
import { getAssociates, approveAssociate, suspendAssociate, assignTerritory } from '@/features/admin/actions/associate-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const status = searchParams.get('status') || undefined
  const limit = Number(searchParams.get('limit')) || 20
  const offset = Number(searchParams.get('offset')) || 0

  const res = await getAssociates({ search, status, limit, offset })
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'approve') {
      const res = await approveAssociate(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    if (action === 'suspend') {
      const res = await suspendAssociate(body.associateId, body.suspend, body.reason)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    if (action === 'assign_territory') {
      const res = await assignTerritory(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
