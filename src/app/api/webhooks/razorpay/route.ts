import { NextResponse } from 'next/server'
import type { ApiError } from '@/types/api'

/**
 * Razorpay Webhook Handler.
 * Verifies signature and processes payment events.
 * SECURITY: Signature must be verified before processing any event.
 */
export async function POST(_request: Request) {
  // Implementation will be added in the payments feature module
  const error: ApiError = {
    success: false,
    error: 'Webhook handler not yet implemented.',
    code: 'NOT_IMPLEMENTED',
  }
  return NextResponse.json(error, { status: 501 })
}
