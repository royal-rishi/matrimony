import { NextResponse } from 'next/server'
import { EmailFactory } from '@/features/notification/email/factory/email.factory'
import { createClient } from '@/lib/supabase/server'
import { EMAIL_TEMPLATES_REGISTRY } from '@/features/notification/email/templates/email-templates.registry'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Check Provider Health
    const service = EmailFactory.create()
    let providerStatus = 'unknown'
    try {
      const healthCheck = await service.provider.health()
      providerStatus = healthCheck.isHealthy ? 'healthy' : 'unhealthy'
    } catch (e) {
      providerStatus = 'unhealthy'
    }

    // 2. Query Queue Status from Database
    const { data: queueData } = await supabase
      .from('email_queue')
      .select('status')

    const counts = { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 }
    if (queueData) {
      for (const item of queueData) {
        const status = item.status as keyof typeof counts
        if (counts[status] !== undefined) {
          counts[status]++
        }
      }
    }

    // 3. Template Count
    const { count: dbTemplateCount } = await supabase
      .from('notification_templates')
      .select('*', { count: 'exact', head: true })
      .eq('channel', 'email')

    const registryTemplateCount = Object.keys(EMAIL_TEMPLATES_REGISTRY).length
    const totalTemplates = registryTemplateCount + (dbTemplateCount || 0)

    return NextResponse.json({
      status: 'healthy',
      provider: {
        id: service.provider.providerId,
        status: providerStatus,
        latencyMs: 0,
      },
      queue: {
        total: (queueData || []).length,
        ...counts,
      },
      templates: {
        dbCount: dbTemplateCount || 0,
        registryCount: registryTemplateCount,
        total: totalTemplates,
      },
      webhook: {
        status: 'active',
      }
    })
  } catch (err) {
    console.error('[API /api/email/health]', err)
    return NextResponse.json(
      { status: 'unhealthy', error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
