import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/features/admin'
import { AlertService } from '@/features/admin/notification/observability/services'

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'rules'

    const service = new AlertService()

    if (type === 'active') {
      const data = await service.getActiveAlerts()
      return NextResponse.json({ success: true, data })
    }

    if (type === 'history') {
      const data = await service.getAlertHistory(50)
      return NextResponse.json({ success: true, data })
    }

    const data = await service.getAllAlertRules()
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[GET /api/admin/notification/alerts]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const service = new AlertService()

    if (body.action === 'evaluate') {
      const res = await service.evaluateAlerts()
      return NextResponse.json({ success: true, data: res })
    }

    const newRule = await service.createAlertRule(body)
    return NextResponse.json({ success: true, data: newRule })
  } catch (err) {
    console.error('[POST /api/admin/notification/alerts]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'Alert rule ID is required for updates.' }, { status: 400 })
    }

    const service = new AlertService()

    if (updates.action === 'resolve') {
      await service.resolveAlert(id, updates.notes)
      return NextResponse.json({ success: true })
    }

    const updated = await service.updateAlertRule(id, updates)
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('[PATCH /api/admin/notification/alerts]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required.' }, { status: 400 })
    }

    const service = new AlertService()
    await service.deleteAlertRule(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/admin/notification/alerts]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
