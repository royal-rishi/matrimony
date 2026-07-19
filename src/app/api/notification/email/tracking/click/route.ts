import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  const targetUrl = request.nextUrl.searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing target redirection URL.' }, { status: 400 })
  }

  try {
    if (id) {
      const supabase = await createClient()
      const nowStr = new Date().toISOString()

      // Update clicked_at and opened_at if missing
      await supabase
        .from('email_queue')
        .update({
          clicked_at: nowStr,
          opened_at: nowStr,
          updated_at: nowStr,
        })
        .eq('id', id)
    }
  } catch (err) {
    console.error('[GET /api/notification/email/tracking/click] Redirection tracking failed:', err)
  }

  // Redirect to target URL (always execute redirection)
  return NextResponse.redirect(targetUrl, 302)
}
