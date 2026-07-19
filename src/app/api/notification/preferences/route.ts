import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationPreferenceService } from '@/features/notification/preferences/services/preferences.service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const service = new NotificationPreferenceService()
    const data = await service.getPreferences(user.id)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[GET /api/notification/preferences]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()
    const service = new NotificationPreferenceService()
    const res = await service.updatePreferences(user.id, body)

    if (res.success) {
      return NextResponse.json({ success: true, data: res.data })
    }
    return NextResponse.json({ error: res.error || 'Failed to update preferences.' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/preferences]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
