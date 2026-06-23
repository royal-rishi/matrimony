'use server'

import { getAdminSession } from './helper'

export async function getAuditLogs(params: {
  search?: string
  action?: string
  limit?: number
  offset?: number
}) {
  try {
    const { supabase } = await getAdminSession('manage_audit_logs')

    let query = supabase
      .from('admin_activity_logs')
      .select(`
        *,
        admin:profiles!admin_activity_logs_admin_id_fkey(first_name, last_name, avatar_url)
      `, { count: 'exact' })

    if (params.action) {
      query = query.eq('action', params.action)
    }

    if (params.search) {
      query = query.or(`action.ilike.%${params.search}%,entity_type.ilike.%${params.search}%`)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 25) - 1)

    const { data, count, error } = await query
    if (error) throw error

    return { success: true, data, totalCount: count || 0 }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
