'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { banUserSchema, mergeUserSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function searchUsers(params: {
  search?: string
  role?: string
  status?: string
  premium?: boolean
  limit?: number
  offset?: number
}) {
  try {
    const { supabase } = await getAdminSession('manage_users')

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)

    if (params.search) {
      query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,city.ilike.%${params.search}%`)
    }
    if (params.role) {
      query = query.eq('role', params.role)
    }
    if (params.premium !== undefined) {
      query = query.eq('is_premium', params.premium)
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

export async function getUserDetail(userId: string) {
  try {
    const { supabase } = await getAdminSession('manage_users')

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select(`
        *,
        verification:user_verifications(*),
        assigned_case:associate_cases!associate_cases_user_id_fkey(*)
      `)
      .eq('id', userId)
      .single()

    if (pErr) throw pErr

    return { success: true, data: profile }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function editUserProfile(userId: string, updates: any) {
  try {
    const { supabase, user } = await getAdminSession('manage_users')

    const { data: oldData } = await supabase.from('profiles').select('*').eq('id', userId).single()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: updates.first_name,
        last_name: updates.last_name,
        religion: updates.religion,
        caste: updates.caste,
        city: updates.city,
        state: updates.state,
        education: updates.education,
        occupation: updates.occupation,
        annual_income: updates.annual_income,
        is_premium: updates.is_premium,
        subscription_tier: updates.subscription_tier,
        is_featured: updates.is_featured,
        is_verified: updates.is_verified,
        gender: updates.gender,
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(supabase, user.id, 'User Profile Edited', 'profiles', userId, oldData || {}, data)
    revalidatePath(`/admin/users`)

    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function banUser(input: { userId: string; reason: string; isPermanent: boolean }) {
  try {
    const { supabase, user } = await getAdminSession('manage_users')
    const validated = banUserSchema.parse(input)

    const { data: oldData } = await supabase.from('profiles').select('*').eq('id', validated.userId).single()

    const { error } = await supabase
      .from('profiles')
      .update({
        is_deleted: true, // ban logic flag
        deleted_at: new Date().toISOString(),
      })
      .eq('id', validated.userId)
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(supabase, user.id, 'User Banned', 'profiles', validated.userId, oldData || {}, { reason: validated.reason, isPermanent: validated.isPermanent })
    revalidatePath(`/admin/users`)

    return { success: true, message: 'User banned and suspended successfully' }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function mergeDuplicateAccounts(input: { masterUserId: string; duplicateUserId: string; reason: string }) {
  try {
    const { supabase, user } = await getAdminSession('manage_users')
    const validated = mergeUserSchema.parse(input)

    // 1. Fetch details
    const { data: duplicateUser } = await supabase.from('profiles').select('*').eq('id', validated.duplicateUserId).single()
    if (!duplicateUser) throw new Error('Duplicate account profile not found')

    // 2. Archive duplicate account
    await supabase
      .from('profiles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', validated.duplicateUserId)

    // 3. Move cases logs if any
    await supabase
      .from('associate_cases')
      .update({ user_id: validated.masterUserId })
      .eq('user_id', validated.duplicateUserId)

    await logAdminActivity(
      supabase,
      user.id,
      'Duplicate Accounts Merged',
      'profiles',
      validated.masterUserId,
      { duplicateUserId: validated.duplicateUserId },
      { reason: validated.reason }
    )

    revalidatePath(`/admin/users`)
    return { success: true, message: 'Duplicate accounts merged successfully!' }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function assignAssociateToClient(userId: string, associateId: string) {
  try {
    const { supabase, user } = await getAdminSession('manage_users')

    // Check if an assignment already exists
    const { data: existing } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('user_id', userId)
      .single()

    let res
    if (existing) {
      res = await supabase
        .from('user_assignments')
        .update({ associate_id: associateId, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      res = await supabase
        .from('user_assignments')
        .insert({ user_id: userId, associate_id: associateId })
    }

    if (res.error) throw res.error

    await logAdminActivity(
      supabase,
      user.id,
      'Associate Assigned to Client',
      'user_assignments',
      userId,
      existing || {},
      { associateId }
    )

    revalidatePath(`/admin/users`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
