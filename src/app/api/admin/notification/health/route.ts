import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin'
import { HealthCheckService } from '@/features/admin/notification/observability/services'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'full'
    const service = new HealthCheckService()

    if (type === 'history') {
      const data = await service.getHealthHistory(24)
      return NextResponse.json({ success: true, data })
    }

    const report = await service.runFullHealthCheck()
    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    console.error('[GET /api/admin/notification/health]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
