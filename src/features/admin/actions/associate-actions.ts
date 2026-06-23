'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { approveAssociateSchema, assignTerritorySchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

export async function getAssociates(params: {
  search?: string
  status?: string
  limit?: number
  offset?: number
}) {
  try {
    const { supabase } = await getAdminSession('manage_associates')

    let query = supabase
      .from('associates')
      .select(`
        *,
        profile:profiles(first_name, last_name, city, state, avatar_url, is_verified),
        kyc:associate_kyc(kyc_status, national_id_type, national_id_number)
      `, { count: 'exact' })

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.search) {
      // Direct filters are simpler than complex joins in Supabase client
      // We will perform local filtering or a join filter if supported
      // Let's filter on profiles
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

export async function approveAssociate(input: { associateId: string; approved: boolean; notes?: string }) {
  try {
    const { supabase, user } = await getAdminSession('manage_associates')
    const validated = approveAssociateSchema.parse(input)

    const newStatus = validated.approved ? 'active' : 'inactive'
    const newKycStatus = validated.approved ? 'approved' : 'rejected'

    // Update associates status
    const { error: assocErr } = await supabase
      .from('associates')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', validated.associateId)

    if (assocErr) throw assocErr

    // Update KYC status
    const { error: kycErr } = await supabase
      .from('associate_kyc')
      .update({
        kyc_status: newKycStatus,
        verification_notes: validated.notes || null,
        verified_by_id: user.id,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validated.associateId)

    if (kycErr) throw kycErr

    await logAdminActivity(
      supabase,
      user.id,
      validated.approved ? 'Associate Approved' : 'Associate Rejected',
      'associates',
      validated.associateId,
      { notes: validated.notes }
    )

    revalidatePath(`/admin/associates`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function suspendAssociate(associateId: string, suspend: boolean, reason: string) {
  try {
    const { supabase, user } = await getAdminSession('manage_associates')

    const newStatus = suspend ? 'suspended' : 'active'

    const { error } = await supabase
      .from('associates')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', associateId)

    if (error) throw error

    await logAdminActivity(
      supabase,
      user.id,
      suspend ? 'Associate Suspended' : 'Associate Activated',
      'associates',
      associateId,
      { reason }
    )

    revalidatePath(`/admin/associates`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function assignTerritory(input: {
  associateId: string
  state: string
  district?: string
  block?: string
}) {
  try {
    const { supabase, user } = await getAdminSession('manage_associates')
    const validated = assignTerritorySchema.parse(input)

    // Check level of territory
    const level = validated.block ? 'block' : validated.district ? 'district' : 'state'

    // Check if territory assignment exists
    const { data: existing } = await supabase
      .from('territory_assignments')
      .select('*')
      .eq('associate_id', validated.associateId)
      .single()

    let res
    if (existing) {
      res = await supabase
        .from('territory_assignments')
        .update({
          level,
          state: validated.state,
          district: validated.district || null,
          block: validated.block || null,
          updated_at: new Date().toISOString()
        })
        .eq('associate_id', validated.associateId)
    } else {
      res = await supabase
        .from('territory_assignments')
        .insert({
          associate_id: validated.associateId,
          level,
          state: validated.state,
          district: validated.district || null,
          block: validated.block || null
        })
    }

    if (res.error) throw res.error

    await logAdminActivity(
      supabase,
      user.id,
      'Territory Assigned',
      'territory_assignments',
      validated.associateId,
      existing || {},
      { level, state: validated.state, district: validated.district, block: validated.block }
    )

    revalidatePath(`/admin/associates`)
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function getAssociatePerformance(associateId: string) {
  try {
    const { supabase } = await getAdminSession('manage_associates')

    // Fetch review ratings count
    const { data: reviews } = await supabase
      .from('associate_reviews')
      .select('rating')
      .eq('associate_id', associateId)

    const avgRating = reviews && reviews.length
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
      : 5.0

    // Fetch referral counts
    const { count: referralsCount } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', associateId)

    // Fetch cases count
    const { count: casesCount } = await supabase
      .from('associate_cases')
      .select('*', { count: 'exact', head: true })
      .eq('associate_id', associateId)

    // Success marriages count
    const { count: successCount } = await supabase
      .from('marriage_successes')
      .select('*', { count: 'exact', head: true })
      .eq('verified_by_id', associateId) // attributed to associate

    // Earnings
    const { data: wallet } = await supabase
      .from('associates')
      .select('wallet_balance')
      .eq('id', associateId)
      .single()

    return {
      success: true,
      data: {
        averageRating: avgRating,
        totalReferrals: referralsCount || 0,
        totalCases: casesCount || 0,
        marriageSuccesses: successCount || 0,
        walletBalance: wallet?.wallet_balance || 0.00
      }
    }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
