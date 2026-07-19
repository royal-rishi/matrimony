import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin'
import { CostAnalyticsService } from '@/features/admin/notification/observability/services'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'breakdown'
    const period = searchParams.get('period') ?? '7d'

    const service = new CostAnalyticsService()

    if (type === 'breakdown') {
      const data = await service.getTodayCost()
      return NextResponse.json({ success: true, data })
    }

    if (type === 'channel') {
      const data = await service.getCostByChannel(period)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'provider') {
      const data = await service.getCostByProvider(period)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'user') {
      const data = await service.getCostPerUser(period)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'trend') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const data = await service.getCostTrend(days)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid cost report type.' }, { status: 400 })
  } catch (err) {
    console.error('[GET /api/admin/notification/cost]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
