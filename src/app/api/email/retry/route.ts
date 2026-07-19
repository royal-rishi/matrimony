import { NextRequest, NextResponse } from 'next/server'
import { retryEmail } from '@/features/notification/email/actions/email.actions'
import { EmailRetryService } from '@/features/notification/email/services/email-retry.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { emailQueueId } = body

    if (emailQueueId) {
      const result = await retryEmail(emailQueueId)
      if (result.success) {
        return NextResponse.json({ success: true, data: result })
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Trigger batch retry process
    const retryService = new EmailRetryService()
    const result = await retryService.processFailedJobs()
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[API /api/email/retry]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
