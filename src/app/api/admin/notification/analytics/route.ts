import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin'
import { AnalyticsService, MonitoringService } from '@/features/admin/notification/observability/services'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'summary'
    const period = (searchParams.get('period') ?? '7d') as '1d' | '7d' | '30d' | '90d'
    const channel = searchParams.get('channel') ?? undefined
    const provider = searchParams.get('provider') ?? undefined

    const service = new AnalyticsService()
    const monitor = new MonitoringService()

    if (type === 'summary') {
      const data = await service.getExecutiveSummary()
      return NextResponse.json({ success: true, data })
    }

    if (type === 'queue') {
      const data = await monitor.getLiveQueueStats()
      return NextResponse.json({ success: true, data })
    }

    if (type === 'events') {
      const limit = Number(searchParams.get('limit') ?? '50')
      const data = await monitor.getRecentDeliveryEvents(limit)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'channels') {
      const data = await service.getChannelAnalytics({ period, channel, provider })
      return NextResponse.json({ success: true, data })
    }

    if (type === 'otp') {
      const data = await service.getOTPAnalytics(period)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'daily') {
      const data = await service.getDailyVolume(period)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'categories') {
      const data = await service.getCategoryBreakdown(period)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: 'Invalid analytics type specified.' }, { status: 400 })
  } catch (err) {
    console.error('[GET /api/admin/notification/analytics]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
