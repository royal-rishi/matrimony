import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 1x1 transparent GIF base64
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')

    if (id) {
      const supabase = await createClient()
      const nowStr = new Date().toISOString()

      // Update email queue status opened_at
      await supabase
        .from('email_queue')
        .update({
          opened_at: nowStr,
          updated_at: nowStr,
        })
        .eq('id', id)

      // Also trigger delivered update if not already set
      await supabase
        .from('email_queue')
        .update({
          delivered_at: nowStr,
        })
        .eq('id', id)
        .is('delivered_at', null)
    }

    // Serve pixel
    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (err) {
    console.error('[GET /api/notification/email/tracking/open] Exception:', err)
    // Serve pixel even if database update fails to avoid image box error
    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    })
  }
}
