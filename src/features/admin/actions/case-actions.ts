'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { caseAssignSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function getAdminCases(params: {
  search?: string
  status?: string
  priority?: string
  limit?: number
  offset?: number
}) {
  try {
    const { supabase } = await getAdminSession('manage_cases')

    let query = supabase
      .from('associate_cases')
      .select(`
        *,
        client:profiles!associate_cases_user_id_fkey(first_name, last_name, avatar_url),
        associate:profiles!associate_cases_associate_id_fkey(first_name, last_name, avatar_url)
      `, { count: 'exact' })

    if (params.status) {
      query = query.eq('status', params.status)
    }
    if (params.priority) {
      query = query.eq('priority', params.priority)
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

export async function assignAssociateToCase(input: { caseId: string; associateId: string; transferReason?: string }) {
  try {
    const { supabase, user } = await getAdminSession('manage_cases')
    const validated = caseAssignSchema.parse(input)

    const { data: oldData } = await supabase.from('associate_cases').select('*').eq('id', validated.caseId).single()

    const { error } = await supabase
      .from('associate_cases')
      .update({
        associate_id: validated.associateId,
        updated_at: new Date().toISOString()
      })
      .eq('id', validated.caseId)
      .select()
      .single()

    if (error) throw error

    // Insert action trigger activity into timeline
    await supabase.from('associate_activities').insert({
      case_id: validated.caseId,
      associate_id: validated.associateId,
      activity_type: 'stage_change', // fits enum
      description: `Case ownership transferred by Super Admin. Reason: ${validated.transferReason || 'System override'}`
    })

    await logAdminActivity(
      supabase,
      user.id,
      'Case Associate Assigned',
      'associate_cases',
      validated.caseId,
      oldData || {},
      { associateId: validated.associateId, reason: validated.transferReason }
    )

    revalidatePath(`/admin/cases`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function closeCase(caseId: string, reason: string) {
  try {
    const { supabase, user } = await getAdminSession('manage_cases')

    const { error } = await supabase
      .from('associate_cases')
      .update({
        status: 'closed',
        closed_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(
      supabase,
      user.id,
      'Case Closed by Admin',
      'associate_cases',
      caseId,
      {},
      { reason }
    )

    revalidatePath(`/admin/cases`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
