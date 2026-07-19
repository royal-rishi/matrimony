import { NextRequest, NextResponse } from 'next/server'
import { createNotificationService } from '@/features/notification/services/notification-service.factory'

export async function GET(request: NextRequest) {
  try {
    const service = createNotificationService()
    const providers = (service as any).providers || []

    const healthChecks = await Promise.all(
      providers.map(async (p: any) => {
        try {
          const check = await p.healthCheck()
          return {
            providerId: p.providerId,
            displayName: p.displayName,
            channel: p.channel,
            isHealthy: check.isHealthy,
            message: check.message,
            checkedAt: new Date().toISOString(),
          }
        } catch (err) {
          return {
            providerId: p.providerId,
            displayName: p.displayName,
            channel: p.channel,
            isHealthy: false,
            message: err instanceof Error ? err.message : 'Health check failed.',
            checkedAt: new Date().toISOString(),
          }
        }
      })
    )

    return NextResponse.json({ success: true, data: healthChecks })
  } catch (err) {
    console.error('[GET /api/admin/notification/provider]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
