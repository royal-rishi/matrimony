'use server'

import { getAssociateSession } from './helper'
import { respondToDisputeSchema, escalateDisputeSchema } from '../validators/dispute'
import { revalidatePath } from 'next/cache'

export async function getMyDisputes() {
  try {
    const { supabase, user } = await getAssociateSession()

    const { data, error } = await supabase
      .from('associate_disputes')
      .select(`
        *,
        client:profiles!associate_disputes_user_id_fkey(
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
    return { success: false, error: error.message || 'Failed to fetch disputes.' }
  }
}

export async function respondToDispute(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = respondToDisputeSchema.parse(rawInput)

    const { data, error } = await supabase
      .from('associate_disputes')
      .update({
        resolution_notes: validated.resolutionNotes,
        status: 'in_review', // changes status from open to in_review
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.disputeId)
      .eq('associate_id', user.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/associate/reviews') // review-dispute sharing routes
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to respond to dispute.' }
  }
}

export async function escalateDispute(rawInput: any) {
  try {
    const { supabase, user } = await getAssociateSession()
    const validated = escalateDisputeSchema.parse(rawInput)

    const { data, error } = await supabase
      .from('associate_disputes')
      .update({
        escalated_to: validated.escalatedTo,
        escalated_at: new Date().toISOString(),
        status: 'in_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.disputeId)
      .eq('associate_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Create a notification for the super admin
    await supabase.from('notifications').insert({
      user_id: validated.escalatedTo,
      title: '⚠️ Dispute Escalated',
      message: `Associate ${user.id} escalated dispute ID: ${validated.disputeId}. Check resolution notes.`,
      type: 'associate',
    })

    revalidatePath('/associate/reviews')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to escalate dispute.' }
  }
}
