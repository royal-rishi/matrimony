import { NextResponse } from 'next/server'
import { searchUsers, banUser, mergeDuplicateAccounts } from '@/features/admin/actions/user-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined
  const role = searchParams.get('role') || undefined
  const premium = searchParams.get('premium') === 'true' ? true : searchParams.get('premium') === 'false' ? false : undefined
  const limit = Number(searchParams.get('limit')) || 20
  const offset = Number(searchParams.get('offset')) || 0

  const res = await searchUsers({ search, role, premium, limit, offset })
  return NextResponse.json(res, { status: res.success ? 200 : 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'merge') {
      const res = await mergeDuplicateAccounts(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    const res = await banUser(body)
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
