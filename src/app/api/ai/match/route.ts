import { NextResponse } from 'next/server'
import type { ApiError } from '@/types/api'

/**
 * AI Match Generation Handler.
 * Generates compatibility recommendations using Gemini / OpenAI.
 * Protected: Requires authenticated user with active subscription.
 */
export async function POST(_request: Request) {
  const error: ApiError = {
    success: false,
    error: 'AI matching handler not yet implemented.',
    code: 'NOT_IMPLEMENTED',
  }
  return NextResponse.json(error, { status: 501 })
}
