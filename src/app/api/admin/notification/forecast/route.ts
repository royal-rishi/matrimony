import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin'
import { ForecastService } from '@/features/admin/notification/observability/services'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const metric = (searchParams.get('metric') ?? 'volume') as 'volume' | 'cost' | 'queue_size'
    const days = Number(searchParams.get('days') ?? '7')

    const service = new ForecastService()

    let forecast
    if (metric === 'volume') {
      forecast = await service.forecastVolume(days)
    } else if (metric === 'cost') {
      forecast = await service.forecastCost(days)
    } else {
      forecast = await service.forecastQueueSize(days * 24)
    }

    // Persist forecast data for deep history lookup
    await service.saveForecast(forecast)

    return NextResponse.json({ success: true, data: forecast })
  } catch (err) {
    console.error('[GET /api/admin/notification/forecast]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
