'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { disputeResolveSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function getAdminDisputes(params: { status?: string; limit?: number; offset?: number }) {
  try {
    const { supabase } = await getAdminSession('manage_disputes')

    let query = supabase
      .from('associate_disputes')
      .select(`
        *,
        case:associate_cases(
          case_number,
          client:profiles!associate_cases_user_id_fkey(first_name, last_name),
          associate:profiles!associate_cases_associate_id_fkey(first_name, last_name)
        ),
        resolver:profiles!associate_disputes_resolved_by_fkey(first_name, last_name)
      `, { count: 'exact' })

    if (params.status) {
      query = query.eq('status', params.status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 20) - 1)

    const { data, count, error } = await query
    if (error) throw error

    return { success: true, data, totalCount: count || 0 }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function assignDisputeResolver(disputeId: string) {
  try {
    const { supabase, user } = await getAdminSession('manage_disputes')

    const { error } = await supabase
      .from('associate_disputes')
      .update({
        resolved_by: user.id,
        status: 'under_investigation' // transitions to investigation status
      })
      .eq('id', disputeId)

    if (error) throw error

    await logAdminActivity(supabase, user.id, 'Dispute Assigned to Self', 'associate_disputes', disputeId)
    revalidatePath(`/admin/disputes`)

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function resolveDispute(input: { disputeId: string; resolutionNotes: string; status: 'resolved' | 'dismissed' }) {
  try {
    const { supabase, user } = await getAdminSession('manage_disputes')
    const validated = disputeResolveSchema.parse(input)

    const { data: oldData } = await supabase.from('associate_disputes').select('*').eq('id', validated.disputeId).single()

    const { data, error } = await supabase
      .from('associate_disputes')
      .update({
        status: validated.status,
        resolution_notes: validated.resolutionNotes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', validated.disputeId)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(supabase, user.id, 'Dispute Resolved', 'associate_disputes', validated.disputeId, oldData || {}, data)
    revalidatePath(`/admin/disputes`)

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
