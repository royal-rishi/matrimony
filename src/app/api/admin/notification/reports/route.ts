import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin'
import { ReportService } from '@/features/admin/notification/observability/services'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') ?? 'daily') as any
    const date = searchParams.get('date') ?? undefined

    const service = new ReportService()

    let report
    if (type === 'daily') {
      report = await service.generateDailyReport(date)
    } else if (type === 'weekly') {
      report = await service.generateWeeklyReport(date)
    } else if (type === 'monthly') {
      report = await service.generateMonthlyReport(date)
    } else if (type === 'provider') {
      report = await service.generateProviderReport(searchParams.get('period') ?? '7d')
    } else {
      report = await service.generateCostReport(searchParams.get('period') ?? '7d')
    }

    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    console.error('[GET /api/admin/notification/reports]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
