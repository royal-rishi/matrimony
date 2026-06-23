'use server'

import { getAssociateSession } from './helper'
import { revalidatePath } from 'next/cache'

export async function getMyReviews() {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_reviews')
      .select(`
        *,
        client:profiles!associate_reviews_user_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        case:associate_cases(
          id,
          case_number
        )
      `)
      .eq('associate_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch reviews.' }
  }
}

export async function getAverageRating() {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_reviews')
      .select('rating')
      .eq('associate_id', user.id)

    if (error) throw error

    const count = data?.length || 0
    const sum = data?.reduce((acc: number, curr: any) => acc + curr.rating, 0) || 0
    const average = count > 0 ? Number((sum / count).toFixed(2)) : 5.0 // default to 5.0 for brand new associates

    return {
      success: true,
      data: {
        averageRating: average,
        totalReviews: count,
      },
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to calculate average rating.' }
  }
}

export async function flagReview(reviewId: string, reason: string) {
  try {
    const { supabase, user } = await getAssociateSession()

    // Flagging a review creates a dispute of type 'poor_service' or custom
    // or logs a dispute so the super admin can review it.
    const { data: review } = await supabase
      .from('associate_reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (!review) throw new Error('Review not found')

    const { data, error } = await supabase
      .from('associate_disputes')
      .insert({
        associate_id: user.id,
        user_id: review.user_id,
        case_id: review.case_id,
        title: `Flagged Review ID: ${review.id}`,
        description: `Associate flagged review rating ${review.rating} star. Reason: ${reason}`,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/associate/reviews')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to flag review.' }
  }
}
