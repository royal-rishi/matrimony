'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { revalidatePath } from 'next/cache'

export async function getFeatureFlags() {
  try {
    const { supabase } = await getAdminSession('manage_settings')
    const { data, error } = await supabase
      .from('system_feature_flags')
      .select('*')
      .order('id', { ascending: true })

    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateFeatureFlag(id: string, isEnabled: boolean) {
  try {
    const { supabase, user } = await getAdminSession('manage_settings')
    
    // Get existing value for logging
    const { data: existing } = await supabase
      .from('system_feature_flags')
      .select('*')
      .eq('id', id)
      .single()

    const { data, error } = await supabase
      .from('system_feature_flags')
      .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(
      supabase,
      user.id,
      `Feature Flag Toggled: ${id} to ${isEnabled ? 'ON' : 'OFF'}`,
      'system_feature_flags',
      null,
      existing || {},
      data || {}
    )

    revalidatePath('/admin/settings')
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
