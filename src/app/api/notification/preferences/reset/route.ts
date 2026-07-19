import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NotificationPreferenceService } from '@/features/notification/preferences/services/preferences.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const service = new NotificationPreferenceService()
    const data = await service.resetPreferences(user.id)

    if (data) {
      return NextResponse.json({ success: true, data })
    }
    return NextResponse.json({ error: 'Failed to reset preferences.' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/notification/preferences/reset]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
