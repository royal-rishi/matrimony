import { NextRequest, NextResponse } from 'next/server'
import { previewEmail } from '@/features/notification/email/actions/email.actions'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventType = searchParams.get('eventType')
    const themeParam = searchParams.get('theme') || 'brand'
    const variablesParam = searchParams.get('variables')

    if (!eventType) {
      return new NextResponse('<p style="color: red;">Missing eventType parameter.</p>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    let variables = {}
    if (variablesParam) {
      try {
        variables = JSON.parse(variablesParam)
      } catch {
        // Fallback if not valid JSON
      }
    }

    const preview = await previewEmail(
      eventType,
      variables,
      themeParam as 'light' | 'dark' | 'brand' | 'auto'
    )

    return new NextResponse(preview.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'X-Template-Found': String(preview.templateFound),
        'X-Subject': encodeURIComponent(preview.subject),
      },
    })
  } catch (err) {
    console.error('[API /api/email/preview]', err)
    return new NextResponse('<p style="color: red;">Internal server error.</p>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}
