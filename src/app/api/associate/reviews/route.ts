import { NextResponse } from 'next/server'
import { getMyReviews, getAverageRating } from '@/features/associate/actions/review-actions'

export async function GET() {
  try {
    const reviews = await getMyReviews()
    const average = await getAverageRating()

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.success ? reviews.data : [],
        average: average.success ? average.data : null,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
