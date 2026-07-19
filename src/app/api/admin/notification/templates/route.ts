import { NextRequest, NextResponse } from 'next/server'
import { createTemplate, updateTemplate, deleteTemplate } from '@/features/admin/notification/actions/admin-notifications.actions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: templates, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: templates })
  } catch (err) {
    console.error('[GET /api/admin/notification/templates]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await createTemplate(body)
    if (res.success) {
      return NextResponse.json({ success: true, data: res.data })
    }
    return NextResponse.json({ error: res.error }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/admin/notification/templates]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'Missing template ID.' }, { status: 400 })
    }

    const res = await updateTemplate(id, updates)
    if (res.success) {
      return NextResponse.json({ success: true, data: res.data })
    }
    return NextResponse.json({ error: res.error }, { status: 400 })
  } catch (err) {
    console.error('[PUT /api/admin/notification/templates]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing template ID.' }, { status: 400 })
    }

    const res = await deleteTemplate(id)
    if (res.success) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: res.error }, { status: 400 })
  } catch (err) {
    console.error('[DELETE /api/admin/notification/templates]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
