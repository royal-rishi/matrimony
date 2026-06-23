'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { recordVerificationSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function getAdminMarriages(params: { limit?: number; offset?: number }) {
  try {
    const { supabase } = await getAdminSession('manage_marriages')

    const { data, count, error } = await supabase
      .from('marriage_successes')
      .select(`
        *,
        case:associate_cases(case_number),
        groom:profiles!marriage_successes_groom_id_fkey(first_name, last_name, avatar_url),
        bride:profiles!marriage_successes_bride_id_fkey(first_name, last_name, avatar_url)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1)

    if (error) throw error
    return { success: true, data, totalCount: count || 0 }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function verifyMarriageSuccess(input: {
  successId: string
  verified: boolean
  isFeatured: boolean
  notes?: string
}) {
  try {
    const { supabase, user } = await getAdminSession('manage_marriages')
    const validated = recordVerificationSchema.parse(input)

    const { data: oldData } = await supabase.from('marriage_successes').select('*').eq('id', validated.successId).single()
    if (!oldData) throw new Error('Marriage success record not found')

    const verifiedAt = validated.verified ? new Date().toISOString() : null
    const verifiedById = validated.verified ? user.id : null

    // Update successes table
    const { data, error } = await supabase
      .from('marriage_successes')
      .update({
        verified_by_id: verifiedById,
        verified_at: verifiedAt,
        is_featured: validated.isFeatured,
        success_story: validated.notes || oldData.success_story,
      })
      .eq('id', validated.successId)
      .select()
      .single()

    if (error) throw error

    // Trigger bonus payout updates to associates if verified is true
    if (validated.verified) {
      // Find case associate
      const { data: caseObj } = await supabase
        .from('associate_cases')
        .select('associate_id')
        .eq('id', oldData.case_id)
        .single()

      if (caseObj?.associate_id) {
        // Log commission ledger insert
        await supabase.from('associate_commission_ledger').insert({
          associate_id: caseObj.associate_id,
          event_type: 'marriage_success',
          amount: 2000.00, // standard seed attribution bonus
          description: `Attributed bonus for successful marriage case completion of Case #${validated.successId.substring(0, 8)}`,
          status: 'calculated'
        })
      }
    }

    await logAdminActivity(
      supabase,
      user.id,
      validated.verified ? 'Marriage Success Verified' : 'Marriage Success Rejected',
      'marriage_successes',
      validated.successId,
      oldData,
      data
    )

    revalidatePath(`/admin/marriages`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
