import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCampaign, scheduleCampaign } from '@/features/admin/notification/actions/admin-notifications.actions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: campaigns, error } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, data: campaigns })
  } catch (err) {
    console.error('[GET /api/admin/notification/campaigns]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, campaignId, scheduledFor } = body

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId.' }, { status: 400 })
    }

    if (action === 'send') {
      const res = await sendCampaign(campaignId)
      if (res.success) {
        return NextResponse.json({ success: true, data: res })
      }
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    if (action === 'schedule') {
      if (!scheduledFor) {
        return NextResponse.json({ error: 'Missing scheduledFor timestamp.' }, { status: 400 })
      }
      const res = await scheduleCampaign(campaignId, scheduledFor)
      if (res.success) {
        return NextResponse.json({ success: true })
      }
      return NextResponse.json({ error: res.error }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid campaign action.' }, { status: 400 })
  } catch (err) {
    console.error('[POST /api/admin/notification/campaigns]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
