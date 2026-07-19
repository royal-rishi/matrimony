import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotificationService } from '@/features/notification/services/notification-service.factory'
import { createNotificationSchema, notificationFiltersSchema } from '@/features/notification/schemas/notification.schemas'
import type { CreateNotificationInput, NotificationFilters } from '@/features/notification/types/notification.types'

// ============================================================
// GET /api/notifications
// Returns paginated notifications for the authenticated user.
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const filtersRaw: Record<string, unknown> = {
      isRead: searchParams.get('isRead') !== null
        ? searchParams.get('isRead') === 'true'
        : undefined,
      eventType: searchParams.get('eventType') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      page: parseInt(searchParams.get('page') ?? '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') ?? '20', 10),
      cursor: searchParams.get('cursor') ?? undefined,
    }

    const parsed = notificationFiltersSchema.safeParse(filtersRaw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const service = createNotificationService()
    const result = await service.getUserNotifications(user.id, parsed.data as NotificationFilters)

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/notifications
// Create and send a notification.
// Requires service-role or admin-level auth in production.
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and super_admins can create notifications via API
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createNotificationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const service = createNotificationService()
    const result = await service.createAndSend(parsed.data as CreateNotificationInput)

    return NextResponse.json({ success: result.success, data: result }, {
      status: result.success ? 201 : 500,
    })
  } catch (err) {
    console.error('[POST /api/notifications]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
